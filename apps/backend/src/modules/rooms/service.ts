import { LocalizedError, type SystemEventCode } from "@molido/i18n";
import { prisma } from "../../db/prisma.js";
import type { CreateRoomInput, HistoryQueryInput, PublicRoomsQueryInput } from "./schemas.js";

export async function createRoom(ownerId: string, input: CreateRoomInput) {
  return prisma.room.create({
    data: {
      name: input.name,
      description: input.description,
      category: input.category ?? "general",
      isPublic: input.isPublic ?? true,
      ownerId,
      members: { create: { userId: ownerId, role: "owner" } },
    },
  });
}

export async function listMyRooms(userId: string) {
  const rooms = await prisma.room.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return rooms.map(({ _count, ...room }) => ({ ...room, memberCount: _count.members }));
}

/**
 * The Yahoo-Messenger-style room lobby: any authenticated user can browse
 * and join these without an invite, optionally filtered by category. Rooms
 * created with `isPublic: false` never appear here (see `joinRoom`).
 */
export async function listPublicRooms(query: PublicRoomsQueryInput) {
  const rooms = await prisma.room.findMany({
    where: { isPublic: true, ...(query.category ? { category: query.category } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return rooms.map(({ _count, ...room }) => ({ ...room, memberCount: _count.members }));
}

export async function requireMembership(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new LocalizedError("GROUP_NOT_FOUND");

  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) throw new LocalizedError("GROUP_FORBIDDEN");

  return { room, membership };
}

export async function joinRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new LocalizedError("GROUP_NOT_FOUND");

  const existing = await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
  if (existing) return room;

  // A private room can only be joined by invite (not modeled yet — see
  // RISK_REGISTER.md); joining by ID alone is a public-lobby-only path.
  if (!room.isPublic) throw new LocalizedError("GROUP_FORBIDDEN");

  await prisma.roomMember.create({ data: { roomId, userId, role: "member" } });
  return room;
}

export async function leaveRoom(roomId: string, userId: string) {
  await requireMembership(roomId, userId);
  await prisma.roomMember.delete({ where: { roomId_userId: { roomId, userId } } });
}

export async function postMessage(roomId: string, senderId: string, body: string) {
  await requireMembership(roomId, senderId);
  const message = await prisma.message.create({
    data: { roomId, senderId, body },
    include: { sender: { select: { username: true } } },
  });
  await prisma.room.update({ where: { id: roomId }, data: { updatedAt: new Date() } });
  return message;
}

/**
 * Persists a system-generated event (spec section 19) as a code + params,
 * never a pre-rendered sentence — every client renders
 * `chat.system.<systemEventCode>` with `{name}` from `systemEventName` in
 * its own viewer locale.
 */
export async function postSystemMessage(roomId: string, code: SystemEventCode, actorName: string) {
  return prisma.message.create({
    data: { roomId, systemEventCode: code, systemEventName: actorName },
  });
}

export async function getHistory(roomId: string, userId: string, query: HistoryQueryInput) {
  await requireMembership(roomId, userId);

  return prisma.message.findMany({
    where: { roomId, ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: query.limit ?? 50,
    include: { sender: { select: { username: true } } },
  });
}
