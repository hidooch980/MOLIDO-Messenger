import { Router } from "express";
import { LocalizedError } from "@molido/i18n";
import { requireAuth } from "../../i18n/require-auth.js";
import { createRoomSchema, historyQuerySchema, publicRoomsQuerySchema } from "./schemas.js";
import { createRoom, listMyRooms, listPublicRooms, joinRoom, leaveRoom, getHistory, postSystemMessage } from "./service.js";

export const roomsRouter = Router();
roomsRouter.use(requireAuth());

roomsRouter.post("/", async (req, res, next) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) return next(new LocalizedError("VALIDATION_FAILED"));

  try {
    const room = await createRoom(req.auth!.sub, parsed.data);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

roomsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listMyRooms(req.auth!.sub));
  } catch (err) {
    next(err);
  }
});

// The Yahoo-style room lobby: browse/join without a prior invite. Must be
// declared before any future `GET /:roomId`-shaped route to avoid "public"
// being parsed as a room id.
roomsRouter.get("/public", async (req, res, next) => {
  const parsed = publicRoomsQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(new LocalizedError("VALIDATION_FAILED"));

  try {
    res.json(await listPublicRooms(parsed.data));
  } catch (err) {
    next(err);
  }
});

roomsRouter.post("/:roomId/join", async (req, res, next) => {
  try {
    const room = await joinRoom(req.params.roomId, req.auth!.sub);
    await postSystemMessage(room.id, "GROUP_MEMBER_JOINED", req.auth!.username);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

roomsRouter.post("/:roomId/leave", async (req, res, next) => {
  try {
    await leaveRoom(req.params.roomId, req.auth!.sub);
    await postSystemMessage(req.params.roomId, "GROUP_MEMBER_LEFT", req.auth!.username);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

roomsRouter.get("/:roomId/messages", async (req, res, next) => {
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(new LocalizedError("VALIDATION_FAILED"));

  try {
    res.json(await getHistory(req.params.roomId, req.auth!.sub, parsed.data));
  } catch (err) {
    next(err);
  }
});
