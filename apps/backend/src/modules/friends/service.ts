import { LocalizedError } from "@molido/i18n";
import { prisma } from "../../db/prisma.js";
import { getStates } from "../../presence/service.js";
import type { SendFriendRequestInput, UpdateProfileInput } from "./schemas.js";

const PUBLIC_PROFILE_SELECT = { id: true, username: true, avatarUrl: true, statusMessage: true } as const;

export async function sendFriendRequest(requesterId: string, input: SendFriendRequestInput) {
  const target = await prisma.user.findUnique({ where: { username: input.username } });
  if (!target) throw new LocalizedError("FRIEND_NOT_FOUND");
  if (target.id === requesterId) throw new LocalizedError("VALIDATION_FAILED");

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: requesterId },
      ],
    },
  });
  if (existing) throw new LocalizedError("FRIEND_REQUEST_EXISTS");

  return prisma.friendship.create({ data: { requesterId, addresseeId: target.id } });
}

export async function listIncomingRequests(userId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: userId, status: "pending" },
    include: { requester: { select: PUBLIC_PROFILE_SELECT } },
    orderBy: { createdAt: "desc" },
  });
}

async function requireOwnFriendship(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new LocalizedError("FRIEND_NOT_FOUND");
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    throw new LocalizedError("FRIEND_FORBIDDEN");
  }
  return friendship;
}

export async function acceptFriendRequest(friendshipId: string, userId: string) {
  const friendship = await requireOwnFriendship(friendshipId, userId);
  if (friendship.addresseeId !== userId) throw new LocalizedError("FRIEND_FORBIDDEN");
  return prisma.friendship.update({ where: { id: friendshipId }, data: { status: "accepted" } });
}

export async function declineFriendRequest(friendshipId: string, userId: string) {
  const friendship = await requireOwnFriendship(friendshipId, userId);
  if (friendship.addresseeId !== userId) throw new LocalizedError("FRIEND_FORBIDDEN");
  await prisma.friendship.delete({ where: { id: friendshipId } });
}

export async function removeFriend(friendshipId: string, userId: string) {
  await requireOwnFriendship(friendshipId, userId);
  await prisma.friendship.delete({ where: { id: friendshipId } });
}

interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  statusMessage: string | null;
}

function otherPartyOf(
  friendship: { requesterId: string; addresseeId: string; requester: PublicProfile; addressee: PublicProfile },
  userId: string
): PublicProfile {
  return friendship.requesterId === userId ? friendship.addressee : friendship.requester;
}

/** The buddy list: accepted friendships, each with the friend's live presence merged in. */
export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: PUBLIC_PROFILE_SELECT },
      addressee: { select: PUBLIC_PROFILE_SELECT },
    },
  });

  const friends = friendships.map((f) => ({ friendshipId: f.id, ...otherPartyOf(f, userId) }));
  const presenceByUserId = await getStates(friends.map((f) => f.id));

  return friends.map((f) => ({ ...f, presence: presenceByUserId[f.id] ?? "offline" }));
}

/** Used by the realtime layer to know who to notify on a presence change, and to gate nudges. */
export async function listFriendUserIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
}

export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    },
  });
  return friendship !== null;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: input.avatarUrl, statusMessage: input.statusMessage },
    select: PUBLIC_PROFILE_SELECT,
  });
}
