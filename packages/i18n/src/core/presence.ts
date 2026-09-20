/**
 * Manual presence states a connected user can set themselves (Yahoo
 * Messenger's Online/Away/Busy). "offline" is never set manually — it's
 * always derived from having zero active connections (see
 * apps/backend/src/presence/service.ts). Rendered via
 * `friends.presence.<state>`, shared by backend and frontend so neither
 * hardcodes its own copy of this list.
 */
export const MANUAL_PRESENCE_STATES = ["online", "away", "busy"] as const;
export type ManualPresenceState = (typeof MANUAL_PRESENCE_STATES)[number];
export type PresenceState = ManualPresenceState | "offline";

export function isManualPresenceState(value: string): value is ManualPresenceState {
  return (MANUAL_PRESENCE_STATES as readonly string[]).includes(value);
}
