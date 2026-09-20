import type { NextFunction, Request, Response } from "express";
import { LocalizedError } from "@molido/i18n";

/**
 * Every API error response carries a stable `code` (spec section 7) plus the
 * resolved `locale`, and never a pre-rendered English sentence — the client
 * is responsible for rendering `errors.<code>` in the viewer's own language.
 */
export function localizedErrorHandler() {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof LocalizedError) {
      res.status(statusForCode(err.code)).json({ code: err.code, params: err.params ?? {}, locale: req.locale });
      return;
    }

    console.error(err);
    res.status(500).json({ code: "UNKNOWN_ERROR", params: {}, locale: req.locale });
  };
}

function statusForCode(code: string): number {
  if (code.startsWith("AUTH_")) return 401;
  if (code === "RATE_LIMITED") return 429;
  if (code.endsWith("_FORBIDDEN")) return 403;
  if (code.endsWith("_NOT_FOUND")) return 404;
  if (code === "VALIDATION_FAILED" || code === "MESSAGE_TOO_LONG" || code.startsWith("MEDIA_")) return 400;
  return 500;
}
