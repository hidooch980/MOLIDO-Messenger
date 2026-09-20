/**
 * Stable, locale-independent error codes (spec section 7). The backend
 * returns these; the client maps each to `errors.<CODE>` and renders it in
 * the viewer's own locale. Never send a pre-rendered English sentence.
 */
export const ERROR_CODES = [
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_SESSION_EXPIRED",
  "AUTH_ACCOUNT_DISABLED",
  "MESSAGE_NOT_FOUND",
  "MESSAGE_FORBIDDEN",
  "MESSAGE_TOO_LONG",
  "GROUP_NOT_FOUND",
  "GROUP_FORBIDDEN",
  "RATE_LIMITED",
  "MEDIA_TOO_LARGE",
  "MEDIA_UNSUPPORTED_TYPE",
  "VALIDATION_FAILED",
  "NETWORK_ERROR",
  "UNKNOWN_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class LocalizedError extends Error {
  constructor(public readonly code: ErrorCode, public readonly params?: Record<string, string | number>) {
    super(code);
    this.name = "LocalizedError";
  }
}

/**
 * System/event codes for chat-generated messages (spec section 19), rendered
 * client-side from `chat.system.<CODE>` — never stored as pre-rendered text.
 */
export const SYSTEM_EVENT_CODES = [
  "GROUP_MEMBER_JOINED",
  "GROUP_MEMBER_LEFT",
  "GROUP_SETTINGS_CHANGED",
  "MESSAGE_DELETED",
  "MESSAGE_EDITED",
] as const;

export type SystemEventCode = (typeof SYSTEM_EVENT_CODES)[number];
