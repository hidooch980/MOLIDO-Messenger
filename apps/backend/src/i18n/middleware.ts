import type { NextFunction, Request, Response } from "express";
import { parseAcceptLanguage, resolveLocale, type LocaleCode } from "@molido/i18n";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Resolved per spec section 3: explicit query/header override -> account pref -> Accept-Language -> default -> en. */
      locale: LocaleCode;
    }
  }
}

/**
 * Resolves the request locale once, up front, so every downstream handler
 * (validation errors, notifications, logs) reads `req.locale` instead of
 * re-deriving it — the single point where resolution order (spec section 3)
 * is implemented for the backend.
 */
export function localeMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const accountPreference = (req as { user?: { locale?: string } }).user?.locale ?? null;
    const explicit = typeof req.query.locale === "string" ? req.query.locale : null;

    req.locale = resolveLocale({
      explicitUserChoice: explicit,
      accountPreference,
      deviceOrBrowserLocales: parseAcceptLanguage(req.headers["accept-language"]),
    });

    next();
  };
}
