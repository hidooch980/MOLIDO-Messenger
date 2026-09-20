/**
 * A minimal in-memory fixed-window rate limiter for Socket.IO event
 * handlers (RISK_REGISTER.md risks 14/18/23). Matches this project's
 * current single-process architecture (see risk 17) — a real multi-instance
 * deployment would need this counted in Redis instead, same as presence.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/**
 * Returns true if the call is allowed, false if `userId` has exceeded
 * `limit` calls to `bucket` within the last `windowMs`.
 */
export function allowRate(userId: string, bucket: string, limit: number, windowMs: number): boolean {
  const key = `${userId}:${bucket}`;
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}
