/**
 * Manual presence states a connected user can set themselves (Yahoo
 * Messenger's Online/Away/Busy/Invisible). Invisible users remain connected
 * but are deliberately exposed as offline to other users. "offline" is
 * otherwise derived from having zero active connections (see
 * apps/backend/src/presence/service.ts). Rendered via
 * `friends.presence.<state>`, shared by backend and frontend.
 */
export const MANUAL_PRESENCE_STATES = ["online", "away", "busy", "invisible"] as const;
export type ManualPresenceState = (typeof MANUAL_PRESENCE_STATES)[number];
/** Public presence never reveals the private "invisible" setting. */
export type PresenceState = "online" | "away" | "busy" | "offline";

export function isManualPresenceState(value: string): value is ManualPresenceState {
  return (MANUAL_PRESENCE_STATES as readonly string[]).includes(value);
}
