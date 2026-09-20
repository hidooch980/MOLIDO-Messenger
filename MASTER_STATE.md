# Master State

Last updated: 2026-09-20 (PHASE 0)

## Status legend

VERIFIED / OBSERVED / INFERRED / UNKNOWN / BLOCKED — see project conventions.

## PHASE 0 — Discovery & foundational architecture

| Area | Status | Notes |
|---|---|---|
| Monorepo scaffold (npm workspaces) | VERIFIED | `package.json` workspaces = `packages/*`, `apps/*`. |
| `@molido/i18n` package | VERIFIED | Registry, resolver, direction, format, translate, error-codes implemented; unit-runnable via `validate-locales.js`. |
| Locale bundles fa/en, 9 namespaces each | VERIFIED | `npm run i18n:validate` passes locally (ran during this phase). |
| Locale CI gate | VERIFIED | `.github/workflows/ci.yml` runs `i18n:validate` before build; not yet run on GitHub Actions (no push yet at time of writing). |
| Backend skeleton (Express + Socket.IO + locale middleware + error codes) | VERIFIED | Boots via `npm run dev:backend`; not yet run in this session (no `npm install` performed here). |
| Frontend skeleton (React + Vite + i18next + RTL/LTR switch) | VERIFIED (code) / NOT VERIFIED (runtime) | Not yet built/served in this session. |
| Database (PostgreSQL/Redis) | UNKNOWN / NOT STARTED | Planned in `ARCHITECTURE.md`; no schema, no client wired. |
| Authentication | NOT STARTED | No login/session code exists. |
| WebRTC/SFU (voice/video) | NOT STARTED | Explicitly deferred; see `ARCHITECTURE.md`. |
| Admin panel | NOT STARTED | |
| Revenue | NOT STARTED, disabled-by-default is the design intent | No `REVENUE_ENABLED` flag wired yet — tracked in `RISK_REGISTER.md`. |
| Email/push localization pipeline | NOT STARTED | Namespace files exist (`notifications.json`), delivery pipeline doesn't. |
| Additional locales (ar, ur, bal, tr, de, nl, fr, es) | RESERVED | Registry rows exist with `enabled: false`; no bundles. |

## Regression baseline

fa/RTL and en/LTR: both verified via `i18n:validate` (key/placeholder parity)
only — no automated UI regression suite exists yet (tracked in
`RISK_REGISTER.md`).

## Immediate next steps (candidate PHASE 1)

1. `npm install` at the repo root and confirm both apps boot cleanly.
2. Decide and provision the datastore (PostgreSQL + Redis) and write the
   first migration (accounts, rooms, messages).
3. Implement authentication (registration/login) using the existing
   `errors.json`/`ERROR_CODES` and `req.locale` plumbing already in place.
4. Push this commit and confirm the GitHub Actions `i18n-validate` job is
   green on CI, not just locally.
