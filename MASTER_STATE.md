# Master State

Last updated: 2026-09-20 (PHASE 5)

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

## PHASE 1 — Authentication & persistence — LOCKED

| Area | Status | Notes |
|---|---|---|
| PostgreSQL provisioned | VERIFIED (local dev only) | Local `postgresql-16` cluster, role `molido`, db `molido_dev`. **Not** provisioned for any deployed environment yet. |
| Prisma schema (`User` model) | VERIFIED | `apps/backend/prisma/schema.prisma`; `localePreference` is free-text, validated against `LOCALE_REGISTRY` at the app layer, not a DB enum — adding a language needs no migration. |
| Initial migration | VERIFIED | `20260920044055_init` applied and reproducible via `prisma migrate deploy`. |
| Register/login endpoints | VERIFIED (live smoke test) | `POST /api/auth/register`, `POST /api/auth/login`. Tested: success, duplicate username → `AUTH_USERNAME_TAKEN` (409), wrong password → `AUTH_INVALID_CREDENTIALS` (401), invalid payload → `VALIDATION_FAILED` (400). Test rows truncated after verification. |
| JWT carries locale claim | VERIFIED (live smoke test) | Registered a user with `localePreference: "en"`; a follow-up authenticated request to `/api/i18n/locales` resolved `"en"` from the token, confirming the account-preference tier of the resolution order actually works end-to-end, not just in the resolver's unit logic. |
| Password hashing | VERIFIED (code) | bcrypt, 12 rounds. |
| Refresh tokens / logout / revocation | NOT STARTED | Current tokens are 7-day JWTs with no revocation list — acceptable for PHASE 1, a gap before production. |
| Confusable-username protection | NOT STARTED | Registration currently restricts usernames to ASCII alphanumeric/underscore, which sidesteps (does not solve) spec section 23's cross-script lookalike concern. |

## PHASE 2 — Rooms & realtime text chat — LOCKED

| Area | Status | Notes |
|---|---|---|
| Rooms/messages schema + migration | VERIFIED | `Room`, `RoomMember`, `Message` (migration `20260920044423_rooms_and_messages`) applied to the local dev cluster. `Message.body` stored exactly as sent, untouched (spec section 8). |
| Create/list room (REST) | VERIFIED (live smoke test) | `POST /api/rooms`, `GET /api/rooms`. |
| Join/leave (REST) + membership enforcement | VERIFIED (live smoke test) | A non-member fetching history got `GROUP_FORBIDDEN` (403, `locale` resolved from their own account); joining then succeeded (204). |
| Message history (REST, paginated) | VERIFIED (code) | `GET /api/rooms/:id/messages` with `before`/`limit`; not yet exercised with >1 page in this session. |
| Realtime chat over Socket.IO | VERIFIED (live smoke test) | Two authenticated users (alice/fa, bob/en) connected with JWTs, joined the same room, and a mixed Persian/English message (`سلام Bob!`) sent by alice was received live by bob with sender identity and original body intact. |
| Socket auth = same JWT as REST | VERIFIED (code) | `io.use()` handshake middleware; no separate/weaker socket auth path. |
| System join/leave events persisted as codes | VERIFIED (code) | `systemEventCode`/`systemEventName` columns, not a rendered sentence; not yet live-pushed over the socket — see `RISK_REGISTER.md`. |
| Message edit/delete | NOT STARTED | Schema has the columns; no routes yet. |
| Public room lobby (Yahoo-style categories) | VERIFIED (live smoke test) | `Room.category`/`Room.isPublic` + `GET /api/rooms/public?category=`. Verified: a public "sports" room appeared filtered and unfiltered; a private room did not appear in either listing; joining the private room by id was rejected with `GROUP_FORBIDDEN`; member count went 1→2 live after a join. Category names translated fa/en via `groups.category.*`. |

## PHASE 3 — Buddy list, presence, and nudge (Yahoo-nostalgia features) — LOCKED

| Area | Status | Notes |
|---|---|---|
| Redis provisioned | VERIFIED (local dev only) | Local `redis-server` 7.0.15; **not** provisioned for any deployed environment yet. |
| `Friendship` model + migration | VERIFIED | Free-text `status` (`pending`/`accepted`), same no-DB-enum convention as the rest of the schema. |
| `User.avatarUrl`/`statusMessage` | VERIFIED | Migration `20260920133508_friendships_and_profile`. |
| Friend request / accept / decline / remove (REST) | VERIFIED (live smoke test) | Sending a duplicate request correctly returned `FRIEND_REQUEST_EXISTS` (409 — a real bug found and fixed this session: it was falling through to 500 before `statusForCode` learned the `_EXISTS`/`_TAKEN` suffix pattern). |
| Buddy list with live presence (REST) | VERIFIED (live smoke test) | `GET /api/friends` correctly showed a friend as "offline" before they connected, "online" after, and "away" after they set it — each read hit Redis live, not a cached value. |
| Presence service (Redis) | VERIFIED (live smoke test) | `registerConnection`/`removeConnection` via `SADD`/`SREM`/`SCARD` on a per-user socket-id set; "offline" is always derived (empty set), never itself stored, so a crashed process can't strand a user "online". |
| Live presence broadcast to friends only | VERIFIED (live smoke test) | A connecting/disconnecting/away-setting user's `presence:update` was only ever observed by their accepted friend, via a personal Socket.IO room (`user:<id>`) — not broadcast globally. |
| Nudge ("buzz") | VERIFIED (live smoke test) | Delivered only between accepted friends (`areFriends()` gate); received live by the target's socket with sender identity. |
| Redis pub/sub across multiple backend instances | NOT STARTED | A single process is the only one broadcasting today. |
| Message edit/delete | NOT STARTED | Schema has the columns; no routes yet. |
| Invite mechanism for private rooms | NOT STARTED | |
| Offline-message "you have new messages" push | NOT STARTED | Messages already persist and are visible on next history fetch — no separate notification exists yet. |
| WebRTC/SFU (voice/video) | NOT STARTED | Explicitly deferred; see `ARCHITECTURE.md`. |
| Admin panel | NOT STARTED | |
| Revenue | NOT STARTED, disabled-by-default is the design intent | `REVENUE_ENABLED=false` present in `.env.example`; no gating logic reads it yet. |
| Email/push localization pipeline | NOT STARTED | |

## PHASE 4 — Frontend UI for auth, buddy list, presence, and nudge — LOCKED

| Area | Status | Notes |
|---|---|---|
| Login/register UI | VERIFIED (live browser test) | Real two-user flow driven through Playwright against the actual `vite` dev server, not just typechecked. |
| Buddy list UI (add friend, requests, presence dots, nudge) | VERIFIED (live browser test) | Two separate browser contexts: alice added bob via the UI form, bob accepted via the UI, alice's presence dot for bob turned live green (`rgb(47, 191, 79)`, matching the "online" color) after bob's browser connected — read from the actual rendered DOM, not an assumption. |
| Nudge UI (toast + shake) | VERIFIED (live browser test) | bob clicked the buddy-list nudge button; alice's browser showed the toast with the correctly interpolated Persian text `uibob برای شما تلنگر فرستاد!`. |
| Classic-messenger visual theme | VERIFIED (code) | `src/styles.css` — violet gradient header, rounded buddy-list panel; an original design, not a copied logo/brand asset. |
| Status message / presence selector UI | VERIFIED (code) | `StatusBar.tsx`; not exercised by the browser test above (only the buddy-list side was driven). |
| Two real bugs found and fixed during this UI work | FIXED | (1) The frontend's dynamic locale `import()` 404'd only under `vite dev` (not `vite build`) — fixed with `import.meta.glob`. (2) i18next's default `{{var}}` delimiter didn't match `packages/i18n`'s own `{var}` JSON convention, so `friends.nudge_received`'s `{name}` rendered literally — fixed by configuring i18next's interpolation delimiters. Full detail in `ARCHITECTURE.md`. |
| Avatar upload UI | NOT STARTED | `PATCH /api/me` accepts a URL; no upload flow exists on either side. |

## PHASE 5 — Rooms/chat frontend UI — LOCKED

| Area | Status | Notes |
|---|---|---|
| `ROOM_CATEGORIES` moved into `@molido/i18n` | VERIFIED | Same reasoning as PHASE 4's presence-state move: the frontend category filter needs the same list the backend validates against, so it now lives in one shared place instead of backend-only. |
| Rooms panel UI (my rooms / public lobby / category filter / create) | VERIFIED (live browser test) | alice created a room via the UI form; bob switched to the lobby tab, saw it listed, and joined via the UI button. |
| Chat room UI (history load, join, send/receive) | VERIFIED (live browser test) | After fixing the socket-state bug below: alice sent a Persian message from her chat view; bob's browser showed it live, with `chat-sender`/`chat-body` populated from the real socket payload. |
| System event rendering (`chat.system.<CODE>`) | VERIFIED (code) | Wired in `ChatRoom.tsx`; not separately exercised by the browser test above (no join/leave event happened to fire during it). |
| A real bug found and fixed: socket stored in a `ref`, not state | FIXED | `SocketContext` held the connected socket in `useRef`, so context consumers only picked it up when *some other* state change (like a buddy `presence:update`) happened to force a re-render. The first version of the rooms/chat test failed exactly here — bob's browser never received alice's message — traced to `useSocket().socket` being `null` the whole time in the room view (no friend traffic to incidentally re-render it). Fixed by switching to `useState`. Re-ran the PHASE 4 buddy/nudge browser test afterward to confirm no regression — still passes. Full detail in `ARCHITECTURE.md`. |

## Regression baseline

fa/RTL and en/LTR: verified via `i18n:validate` (key/placeholder parity,
across 10 namespaces including `friends`) plus every PHASE 1–5 live smoke
test above, run in both API-only scripts (PHASE 1–3) and a real browser
(PHASE 4–5). After the PHASE 5 socket-state fix, the PHASE 4 buddy/presence/
nudge browser test was re-run and still passes — no regression.
(tracked further in `RISK_REGISTER.md`).

## Immediate next steps (candidate PHASE 6)

1. Push system join/leave events live over the socket, not just on next
   history fetch, and add a browser test that actually exercises one.
2. Add message edit/delete routes and UI using the existing
   `editedAt`/`deletedAt` columns and `chat.system.MESSAGE_EDITED`/
   `MESSAGE_DELETED` keys.
3. Design an invite mechanism for private rooms.
4. Resolve the i18next pluralization-key mismatch (risk 20 in
   `RISK_REGISTER.md`) before any UI uses a plural string.
5. Add refresh-token/logout/session-revocation before any production use.
6. Provision PostgreSQL + Redis for a real deployed environment (still only
   local dev instances) and wire secrets, not committed files.
7. Push and confirm the GitHub Actions `i18n-validate` job is green on CI.
