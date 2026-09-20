import type { NextFunction, Request, Response } from "express";
import { parseAcceptLanguage, resolveLocale, type LocaleCode } from "@molido/i18n";
import { verifyToken, type AuthTokenPayload } from "../modules/auth/service.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Resolved per spec section 3: explicit query/header override -> account pref -> Accept-Language -> default -> en. */
      locale: LocaleCode;
      /** Set only when a valid bearer token was presented. */
      auth?: AuthTokenPayload;
    }
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

/**
 * Resolves the request locale once, up front, so every downstream handler
 * (validation errors, notifications, logs) reads `req.locale` instead of
 * re-deriving it — the single point where resolution order (spec section 3)
 * is implemented for the backend.
 *
 * The account preference comes from the JWT's own `locale` claim (set at
 * login/register time), not a fresh DB read — an expired/absent/invalid
 * token simply means no account preference is available, it never fails
 * the request; route-level auth guards are what enforce a session.
 */
export function localeMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readBearerToken(req);
    let accountPreference: string | null = null;

    if (token) {
      try {
        req.auth = verifyToken(token);
        accountPreference = req.auth.locale;
      } catch {
        // Invalid/expired token: locale resolution falls through; anything
        // that actually requires authentication enforces that separately.
      }
    }

    const explicit = typeof req.query.locale === "string" ? req.query.locale : null;

    req.locale = resolveLocale({
      explicitUserChoice: explicit,
      accountPreference,
      deviceOrBrowserLocales: parseAcceptLanguage(req.headers["accept-language"]),
    });

    next();
  };
}
