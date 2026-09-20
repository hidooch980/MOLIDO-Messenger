# Master State

Last updated: 2026-09-20 (PHASE 1)

## Status legend

VERIFIED / OBSERVED / INFERRED / UNKNOWN / BLOCKED — see project conventions.

## PHASE 0 — Discovery & foundational architecture — LOCKED

| Area | Status | Notes |
|---|---|---|
| Monorepo scaffold (npm workspaces) | VERIFIED | `package.json` workspaces = `packages/*`, `apps/*`. |
| `@molido/i18n` package | VERIFIED | Registry, resolver, direction, format, translate, error-codes implemented. |
| Locale bundles fa/en, 9 namespaces each | VERIFIED | `npm run i18n:validate` passes. |
| Locale CI gate | VERIFIED (local) | `.github/workflows/ci.yml` runs `i18n:validate` before build; GitHub Actions run not yet observed. |
| Backend skeleton | VERIFIED | Boots via `tsx`; smoke-tested. |
| Frontend skeleton | VERIFIED | Built with `vite build`; dev server smoke-tested, served `dir="rtl"`. |
| Additional locales (ar, ur, bal, tr, de, nl, fr, es) | RESERVED | Registry rows exist with `enabled: false`; no bundles. |

## PHASE 1 — Authentication & persistence — IN PROGRESS

| Area | Status | Notes |
|---|---|---|
| PostgreSQL provisioned | VERIFIED (local dev only) | Local `postgresql-16` cluster, role `molido`, db `molido_dev`. **Not** provisioned for any deployed environment yet. |
| Prisma schema (`User` model) | VERIFIED | `apps/backend/prisma/schema.prisma`; `localePreference` is free-text, validated against `LOCALE_REGISTRY` at the app layer, not a DB enum — adding a language needs no migration. |
| Initial migration | VERIFIED | `20260920044055_init` applied and reproducible via `prisma migrate deploy`. |
| Register/login endpoints | VERIFIED (live smoke test) | `POST /api/auth/register`, `POST /api/auth/login`. Tested: success, duplicate username → `AUTH_USERNAME_TAKEN` (409), wrong password → `AUTH_INVALID_CREDENTIALS` (401), invalid payload → `VALIDATION_FAILED` (400). Test rows truncated after verification. |
| JWT carries locale claim | VERIFIED (live smoke test) | Registered a user with `localePreference: "en"`; a follow-up authenticated request to `/api/i18n/locales` resolved `"en"` from the token, confirming the account-preference tier of the resolution order actually works end-to-end, not just in the resolver's unit logic. |
| Password hashing | VERIFIED (code) | bcrypt, 12 rounds. |
| Redis (presence/pub-sub) | NOT STARTED | Not needed until realtime presence/multi-instance scaling work begins. |
| Refresh tokens / logout / revocation | NOT STARTED | Current tokens are 7-day JWTs with no revocation list — acceptable for PHASE 1, a gap before production. |
| Rooms / messages schema | NOT STARTED | Next candidate for PHASE 2. |
| WebRTC/SFU (voice/video) | NOT STARTED | Explicitly deferred; see `ARCHITECTURE.md`. |
| Admin panel | NOT STARTED | |
| Revenue | NOT STARTED, disabled-by-default is the design intent | `REVENUE_ENABLED=false` now present in `.env.example`; no gating logic reads it yet. |
| Email/push localization pipeline | NOT STARTED | |
| Confusable-username protection | NOT STARTED | Registration currently restricts usernames to ASCII alphanumeric/underscore, which sidesteps (does not solve) spec section 23's cross-script lookalike concern. |

## Regression baseline

fa/RTL and en/LTR: verified via `i18n:validate` (key/placeholder parity,
now including `AUTH_USERNAME_TAKEN`/`AUTH_EMAIL_TAKEN`) plus the PHASE 1 live
auth smoke tests above. No automated UI regression suite exists yet
(tracked in `RISK_REGISTER.md`).

## Immediate next steps (candidate PHASE 2)

1. Design and migrate the rooms/messages schema, keeping message body
   storage untouched/original per spec section 8.
2. Add refresh-token/logout/session-revocation before any production use.
3. Provision PostgreSQL for a real deployed environment (this phase only
   verified a local dev cluster) and wire `DATABASE_URL` via secrets, not a
   committed file.
4. Push and confirm the GitHub Actions `i18n-validate` job is green on CI.
