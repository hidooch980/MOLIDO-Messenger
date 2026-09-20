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
import { verifyToken, type AuthTokenPayload } from "./modules/auth/service.js";
import { requireMembership, postMessage } from "./modules/rooms/service.js";

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

app.use(localizedErrorHandler());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });

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

io.on("connection", (socket) => {
  const auth = socket.data.auth as AuthTokenPayload;

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
