import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { ENABLED_LOCALES, LOCALE_REGISTRY, LocalizedError } from "@molido/i18n";
import { localeMiddleware } from "./i18n/middleware.js";
import { localizedErrorHandler } from "./i18n/error-handler.js";
import { authRouter } from "./modules/auth/routes.js";

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

app.use(localizedErrorHandler());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("chat:join", (roomId: string) => {
    socket.join(roomId);
  });

  socket.on("chat:message", (payload: { roomId: string; body: string }) => {
    io.to(payload.roomId).emit("chat:message", {
      roomId: payload.roomId,
      body: payload.body,
      sentAt: new Date().toISOString(),
    });
  });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`MOLIDO backend listening on :${port}`);
});
