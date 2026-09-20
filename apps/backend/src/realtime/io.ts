import type { Server as SocketIOServer } from "socket.io";

/**
 * Holds the one Socket.IO server instance so REST route handlers (which
 * don't have a socket of their own) can still push a live event — e.g. a
 * join/leave system message — without a circular import between
 * `index.ts` (which owns `io`) and the route modules.
 */
let io: SocketIOServer | null = null;

export function setIO(server: SocketIOServer) {
  io = server;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO server not initialized yet");
  return io;
}
