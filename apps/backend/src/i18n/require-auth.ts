import type { NextFunction, Request, Response } from "express";
import { LocalizedError } from "@molido/i18n";

/**
 * `localeMiddleware` decodes a bearer token when present but never rejects a
 * request over it (locale resolution must degrade gracefully). Routes that
 * actually require a session use this on top of it.
 */
export function requireAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new LocalizedError("AUTH_SESSION_EXPIRED"));
      return;
    }
    next();
  };
}
