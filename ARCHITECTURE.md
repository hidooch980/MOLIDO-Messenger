# Architecture

Status: PHASE 5 — rooms/chat now have a working frontend UI alongside the
buddy list, presence, and nudge, all verified in a real browser on top of
local dev PostgreSQL + Redis. Nothing below is deployed to a real
environment.

## Overview

MOLIDO Messenger is a real-time messenger (text, voice, video) organized as
an npm-workspaces monorepo:

```
packages/i18n     Shared locale registry/resolution/formatting/translation.
apps/backend      Express + Socket.IO API and realtime signaling.
apps/frontend     React + Vite web client.
```

## Backend (`apps/backend`)

- Express for REST, Socket.IO for realtime chat events and (later) WebRTC
  signaling.
- `src/i18n/middleware.ts` resolves `req.locale` once per request from
  query/account/`Accept-Language` per the order in `I18N_ARCHITECTURE.md`.
- `src/i18n/error-handler.ts` maps thrown `LocalizedError`s to a stable JSON
  error shape `{ code, params, locale }` — never a pre-rendered sentence.
- PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`) — `User`
  (now with `avatarUrl`/`statusMessage`), `Room`, `RoomMember`, `Message`,
  `Friendship`. Bcrypt password hashing and JWT-based sessions
  (`src/modules/auth`). Verified against a local dev cluster only; not yet
  provisioned for a deployed environment — see `RISK_REGISTER.md`.
- `src/modules/rooms`: create/list rooms, join/leave (REST), message
  history (REST, paginated by `before`/`limit`). A message's `body` is
  stored exactly as typed — no translation or normalization on write (spec
  section 8).
- Yahoo-style public room lobby: `Room.category` (free-text code from
  `ROOM_CATEGORIES`, now defined in `@molido/i18n` so backend and frontend
  share one list — same no-DB-enum pattern as `LOCALE_REGISTRY`, rendered
  via `groups.category.<code>`) and `Room.isPublic`.
  `GET /api/rooms/public?category=...` lists public rooms with a live
  member count, joinable without a prior invite; `joinRoom()` rejects a
  join-by-id attempt on a private room with `GROUP_FORBIDDEN`. There is no
  invite mechanism for private rooms yet (tracked in `RISK_REGISTER.md`).
- Realtime chat: Socket.IO requires the same JWT as the REST API
  (`io.use` handshake middleware) — there is no separate, weaker socket
  auth. `chat:join` re-checks room membership server-side before
  `socket.join`; `chat:message` persists via the same `postMessage()` the
  REST layer would use, then broadcasts to the room.
- System events (`GROUP_MEMBER_JOINED`, `GROUP_MEMBER_LEFT`) are persisted
  as message rows carrying a `systemEventCode` + `systemEventName`, never a
  pre-rendered sentence — a client renders `chat.system.<CODE>` in its own
  locale (spec section 19). They are written by the REST join/leave routes,
  not yet pushed live over the socket — a deliberate PHASE 2 scope cut (see
  `RISK_REGISTER.md`): a client sees them on its next history fetch, not
  instantly.
- `src/modules/friends`: Yahoo-style buddy list. `Friendship` is a
  free-text-status (`pending`/`accepted`) request/accept flow —
  `POST/GET /api/friends/requests`, `POST /api/friends/requests/:id/accept|decline`,
  `GET /api/friends` (accepted friends merged with live presence),
  `DELETE /api/friends/:id`. `PATCH /api/me` sets `avatarUrl`/`statusMessage`.
- `src/presence` (Redis, via `ioredis`): live online/away/busy/offline state.
  A user's active socket ids live in a Redis Set
  (`presence:sockets:<userId>`); "offline" is always derived from that set
  being empty, never stored — so a crashed process can't leave a user stuck
  "online" forever. A manual state (`presence:state:<userId>`) holds
  online/away/busy while at least one socket is connected. `getStates()`
  batches lookups via a Redis pipeline for the buddy-list endpoint.
- Realtime presence + nudge: every socket joins a personal room
  (`user:<id>`) on connect, so any backend instance can address a specific
  user directly. On first connect / last disconnect, `presence:update` is
  broadcast to the user's accepted friends only (`listFriendUserIds()`).
  `presence:set` lets a client manually switch online/away/busy.
  `friend:nudge` (Yahoo's "buzz") is gated by `areFriends()` — delivered
  only between accepted friends, straight to the target's personal room.

## Frontend (`apps/frontend`)

- React 18 + Vite, `i18next`/`react-i18next` wired to `@molido/i18n`'s locale
  registry and namespace bundles via `import.meta.glob` (not a dynamic
  subpath-export `import()` — see the PHASE 4 bug note below).
- `applyDocumentDirection()` keeps `<html lang dir>` in sync with the active
  locale on boot and on every language switch.
- `src/auth/AuthContext.tsx`: login/register/logout, persists `{token, user}`
  to `localStorage`, applies the account's `localePreference` on login.
- `src/socket/SocketContext.tsx`: owns the one Socket.IO connection for the
  session (connects once a token exists, disconnects on logout), tracks live
  `presence:update` overrides and the most recent `friend:nudge` in React
  state so any component can react to them without its own listener.
- `src/components`: `LoginForm`, `StatusBar` (presence selector + status
  message), `BuddyList` (add friend, incoming requests, presence dots,
  nudge button), `PresenceDot`, `NudgeToast` (a self-dismissing toast with a
  brief shake animation — the spiritual descendant of the classic
  window-shake buzz).
- `src/styles.css`: a stylistic homage to the era's messenger look (violet
  gradient title bar, rounded panel, compact buddy rows) — an original
  design, not a copy of any product's actual logo or brand assets.
- `src/components/RoomsPanel.tsx`: "My rooms" / "Room lobby" tabs, a
  category filter (`ROOM_CATEGORIES` from `@molido/i18n`), create-room
  form, and join-from-lobby — the frontend counterpart to PHASE 2/2.5's
  rooms backend.
- `src/components/ChatRoom.tsx`: loads history via REST on entry, joins the
  Socket.IO room (`chat:join`), sends/receives `chat:message` live, and
  renders system events via `chat.system.<CODE>` instead of a hardcoded
  sentence.

### Real bugs this UI work found (fixed, not just noted)

Building and *actually loading this in a browser* — not just typechecking —
surfaced bugs that had been sitting undetected since earlier phases:

1. (PHASE 4) `apps/frontend/src/i18n/index.ts` dynamically imported
   `` `@molido/i18n/locales/${locale}/${ns}.json` ``. Vite's **production**
   build (`vite build`) happened to resolve this and had been passing since
   PHASE 0 — but Vite's **dev server** 404s on a subpath-export pattern
   built from a runtime template literal, so the whole app failed to boot
   under `npm run dev` specifically. Fixed by switching to
   `import.meta.glob(...)`, Vite's documented dev-and-build-safe way to
   import a directory of files by pattern.
2. (PHASE 4) `friends.nudge_received`'s `{name}` placeholder rendered as the
   literal string `{name}` instead of interpolating, because i18next's
   default delimiter is `{{var}}` while every JSON bundle was written for
   `packages/i18n`'s own `Translator` (`core/translate.ts`), which uses
   `{var}`. Fixed by setting i18next's `interpolation.prefix`/`suffix` to
   `{`/`}` so both consumers of the same JSON files agree on one syntax.
   A related but not-yet-triggered mismatch (dot-suffix vs. i18next's
   underscore-suffix pluralization keys) is tracked in `RISK_REGISTER.md`.
3. (PHASE 5) `SocketContext` originally stored the connected socket in a
   `useRef`, not React state. A ref update doesn't trigger a re-render, so
   context consumers only ever saw the freshly connected socket once
   *something else* forced `SocketProvider` to re-render — which happened
   to be true for the buddy list (friend `presence:update` events kept
   firing) but not for a brand-new room with no prior socket traffic, where
   `useSocket().socket` stayed `null` forever and `chat:join`/`chat:message`
   silently no-opped via optional chaining. Caught only because the actual
   two-browser chat test showed one side never receiving a live message;
   fixed by moving the socket into `useState` so connecting always
   triggers the render that updates every consumer.

## Realtime media (voice/video, Paltalk-style rooms)

Not yet implemented. Planned: WebRTC with an SFU (mediasoup) so a room
scales past 1:1 calls; Socket.IO carries signaling. This is explicit future
work, not a half-built feature in this PHASE 0 commit.

## Why this stack

- Socket.IO: mature, handles reconnection/room semantics out of the box —
  avoids reinventing presence/room primitives for an MVP.
- mediasoup (planned): self-hostable SFU, avoids per-minute vendor costs of
  managed WebRTC platforms for a Paltalk-style multi-party room.
- PostgreSQL: relational integrity for accounts/rooms/messages/friendships.
  Redis: live presence state — chosen over storing "online/offline" in
  Postgres because it's ephemeral, per-connection state that must vanish
  automatically (via `SREM`+`SCARD`, no TTL polling needed) rather than be
  durably persisted; a natural fit for a future multi-instance pub/sub
  layer too, which Postgres isn't.

## Explicitly deferred to later phases

- Live socket push of system join/leave events (currently REST-only, visible
  on next history fetch).
- Message edit/delete endpoints (schema has `editedAt`/`deletedAt`; no
  routes yet).
- Invite mechanism for private rooms.
- Emoticon icons and a "beep" doorbell sound for the classic-messenger feel
  (the visual theme itself — colors, panel shapes — shipped in PHASE 4).
- Offline message notification (messages already persist and are fetched on
  next history call — a returning user simply sees them; there is no
  separate "you have new messages" push yet).
- Redis pub/sub across multiple backend instances — a single process is
  the only one broadcasting today; horizontal scaling needs this.
- Refresh tokens, logout, and session revocation.
- WebRTC/SFU integration.
- Push notification delivery pipeline.
- Admin panel.
- Revenue/billing (ships disabled — `REVENUE_ENABLED=false` — by default).
