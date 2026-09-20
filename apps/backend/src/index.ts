import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { ENABLED_LOCALES, LOCALE_REGISTRY, LocalizedError } from "@molido/i18n";
import { localeMiddleware } from "./i18n/middleware.js";
import { localizedErrorHandler } from "./i18n/error-handler.js";
import { authRouter } from "./modules/auth/routes.js";
import { roomsRouter } from "./modules/rooms/routes.js";
import { friendsRouter, profileRouter } from "./modules/friends/routes.js";
import { verifyToken, type AuthTokenPayload } from "./modules/auth/service.js";
import { requireMembership, postMessage } from "./modules/rooms/service.js";
import { listFriendUserIds, areFriends } from "./modules/friends/service.js";
import { registerConnection, removeConnection, setManualState, isManualPresenceState } from "./presence/service.js";
import { setIO } from "./realtime/io.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(localeMiddleware());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Lets any client (web, future mobile) drive its language switcher from a
// single source of truth instead of hardcoding the locale list.
app.get("/api/i18n/locales", (req, res) => {
  res.json({
    resolved: req.locale,
    enabled: ENABLED_LOCALES.map((code) => LOCALE_REGISTRY[code]),
  });
});

app.get("/api/i18n/error-demo/:code", (req, res, next) => {
  next(new LocalizedError(req.params.code as never));
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/me", profileRouter);

app.use(localizedErrorHandler());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
setIO(io);

// Every realtime connection must present the same JWT the REST API uses —
// there is no separate, weaker "socket auth".
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("AUTH_SESSION_EXPIRED"));
    return;
  }
  try {
    socket.data.auth = verifyToken(token) satisfies AuthTokenPayload;
    next();
  } catch {
    next(new Error("AUTH_SESSION_EXPIRED"));
  }
});

/** Every user has a personal room, so any server instance can address them directly by id. */
function personalRoom(userId: string) {
  return `user:${userId}`;
}

async function broadcastPresence(io: SocketIOServer, userId: string, state: string) {
  const friendIds = await listFriendUserIds(userId);
  for (const friendId of friendIds) {
    io.to(personalRoom(friendId)).emit("presence:update", { userId, state });
  }
}

io.on("connection", (socket) => {
  const auth = socket.data.auth as AuthTokenPayload;
  socket.join(personalRoom(auth.sub));

  registerConnection(auth.sub, socket.id).then((wentOnline) => {
    if (wentOnline) void broadcastPresence(io, auth.sub, "online");
  });

  socket.on("disconnect", () => {
    removeConnection(auth.sub, socket.id).then((wentOffline) => {
      if (wentOffline) void broadcastPresence(io, auth.sub, "offline");
    });
  });

  socket.on("presence:set", async (state: string, ack?: (error?: string) => void) => {
    if (!isManualPresenceState(state)) {
      ack?.("VALIDATION_FAILED");
      return;
    }
    await setManualState(auth.sub, state);
    await broadcastPresence(io, auth.sub, state);
    ack?.();
  });

  // Yahoo Messenger's "buzz" — only deliverable between accepted friends.
  socket.on("friend:nudge", async (toUserId: string, ack?: (error?: string) => void) => {
    try {
      const isFriend = await areFriends(auth.sub, toUserId);
      if (!isFriend) throw new LocalizedError("FRIEND_FORBIDDEN");
      io.to(personalRoom(toUserId)).emit("friend:nudge", { fromUserId: auth.sub, fromUsername: auth.username });
      ack?.();
    } catch (err) {
      ack?.(err instanceof LocalizedError ? err.code : "UNKNOWN_ERROR");
    }
  });

  // 1:1 WebRTC signaling relay. The server never touches media — it only
  // forwards SDP offers/answers and ICE candidates between two friends'
  // personal rooms, gated the same way as friend:nudge.
  async function forwardIfFriends<T extends { toUserId: string }>(
    payload: T,
    event: string,
    ack?: (error?: string) => void
  ) {
    try {
      const isFriend = await areFriends(auth.sub, payload.toUserId);
      if (!isFriend) throw new LocalizedError("FRIEND_FORBIDDEN");
      const { toUserId, ...rest } = payload;
      io.to(personalRoom(toUserId)).emit(event, { ...rest, fromUserId: auth.sub, fromUsername: auth.username });
      ack?.();
    } catch (err) {
      ack?.(err instanceof LocalizedError ? err.code : "UNKNOWN_ERROR");
    }
  }

  socket.on("call:invite", (payload: { toUserId: string; video: boolean }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:incoming", ack)
  );
  socket.on("call:accept", (payload: { toUserId: string }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:accepted", ack)
  );
  socket.on("call:decline", (payload: { toUserId: string }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:declined", ack)
  );
  socket.on("call:end", (payload: { toUserId: string }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:ended", ack)
  );
  socket.on("call:offer", (payload: { toUserId: string; sdp: unknown }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:offer", ack)
  );
  socket.on("call:answer", (payload: { toUserId: string; sdp: unknown }, ack?: (error?: string) => void) =>
    forwardIfFriends(payload, "call:answer", ack)
  );
  socket.on(
    "call:ice-candidate",
    (payload: { toUserId: string; candidate: unknown }, ack?: (error?: string) => void) =>
      forwardIfFriends(payload, "call:ice-candidate", ack)
  );

  socket.on("chat:join", async (roomId: string, ack?: (error?: string) => void) => {
    try {
      await requireMembership(roomId, auth.sub);
      socket.join(roomId);
      ack?.();
    } catch (err) {
      ack?.(err instanceof LocalizedError ? err.code : "UNKNOWN_ERROR");
    }
  });

  socket.on("chat:message", async (payload: { roomId: string; body: string }, ack?: (error?: string) => void) => {
    try {
      const message = await postMessage(payload.roomId, auth.sub, payload.body);
      io.to(payload.roomId).emit("chat:message", {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderUsername: auth.username,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      });
      ack?.();
    } catch (err) {
      ack?.(err instanceof LocalizedError ? err.code : "UNKNOWN_ERROR");
    }
  });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`MOLIDO backend listening on :${port}`);
});
