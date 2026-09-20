import { Router } from "express";
import { LocalizedError } from "@molido/i18n";
import { requireAuth } from "../../i18n/require-auth.js";
import { sendFriendRequestSchema, updateProfileSchema } from "./schemas.js";
import {
  sendFriendRequest,
  listIncomingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  listFriends,
  updateProfile,
} from "./service.js";

export const friendsRouter = Router();
friendsRouter.use(requireAuth());

friendsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listFriends(req.auth!.sub));
  } catch (err) {
    next(err);
  }
});

friendsRouter.get("/requests", async (req, res, next) => {
  try {
    res.json(await listIncomingRequests(req.auth!.sub));
  } catch (err) {
    next(err);
  }
});

friendsRouter.post("/requests", async (req, res, next) => {
  const parsed = sendFriendRequestSchema.safeParse(req.body);
  if (!parsed.success) return next(new LocalizedError("VALIDATION_FAILED"));

  try {
    res.status(201).json(await sendFriendRequest(req.auth!.sub, parsed.data));
  } catch (err) {
    next(err);
  }
});

friendsRouter.post("/requests/:id/accept", async (req, res, next) => {
  try {
    res.json(await acceptFriendRequest(req.params.id, req.auth!.sub));
  } catch (err) {
    next(err);
  }
});

friendsRouter.post("/requests/:id/decline", async (req, res, next) => {
  try {
    await declineFriendRequest(req.params.id, req.auth!.sub);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

friendsRouter.delete("/:id", async (req, res, next) => {
  try {
    await removeFriend(req.params.id, req.auth!.sub);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export const profileRouter = Router();
profileRouter.use(requireAuth());

profileRouter.patch("/", async (req, res, next) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return next(new LocalizedError("VALIDATION_FAILED"));

  try {
    res.json(await updateProfile(req.auth!.sub, parsed.data));
  } catch (err) {
    next(err);
  }
});
