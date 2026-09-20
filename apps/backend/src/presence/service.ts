import type { ManualPresenceState, PresenceState } from "@molido/i18n";
import { redis } from "./redis.js";

export { MANUAL_PRESENCE_STATES, isManualPresenceState, type ManualPresenceState, type PresenceState } from "@molido/i18n";

function socketsKey(userId: string) {
  return `presence:sockets:${userId}`;
}
function stateKey(userId: string) {
  return `presence:state:${userId}`;
}

/** Registers a new realtime connection. Returns true if this is the user's first (i.e. they just came online). */
export async function registerConnection(userId: string, socketId: string): Promise<boolean> {
  const before = await redis.scard(socketsKey(userId));
  await redis.sadd(socketsKey(userId), socketId);
  if (before === 0) {
    await redis.set(stateKey(userId), "online" satisfies ManualPresenceState);
    return true;
  }
  return false;
}

/** Removes a connection. Returns true if the user has no connections left (i.e. they just went offline). */
export async function removeConnection(userId: string, socketId: string): Promise<boolean> {
  await redis.srem(socketsKey(userId), socketId);
  const remaining = await redis.scard(socketsKey(userId));
  if (remaining === 0) {
    await redis.del(stateKey(userId));
    return true;
  }
  return false;
}

/** Only meaningful while the user has at least one active connection. */
export async function setManualState(userId: string, state: ManualPresenceState): Promise<void> {
  const connected = (await redis.scard(socketsKey(userId))) > 0;
  if (connected) await redis.set(stateKey(userId), state);
}

export async function getState(userId: string): Promise<PresenceState> {
  const connected = (await redis.scard(socketsKey(userId))) > 0;
  if (!connected) return "offline";
  return ((await redis.get(stateKey(userId))) as ManualPresenceState | null) ?? "online";
}

export async function getStates(userIds: string[]): Promise<Record<string, PresenceState>> {
  if (userIds.length === 0) return {};

  const pipeline = redis.pipeline();
  for (const id of userIds) pipeline.scard(socketsKey(id));
  const socketCounts = (await pipeline.exec()) ?? [];

  const statePipeline = redis.pipeline();
  for (const id of userIds) statePipeline.get(stateKey(id));
  const states = (await statePipeline.exec()) ?? [];

  const result: Record<string, PresenceState> = {};
  userIds.forEach((id, i) => {
    const count = Number(socketCounts[i]?.[1] ?? 0);
    if (count === 0) {
      result[id] = "offline";
    } else {
      result[id] = (states[i]?.[1] as ManualPresenceState | null) ?? "online";
    }
  });
  return result;
}
