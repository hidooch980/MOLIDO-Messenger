# Architecture

Status: PHASE 2 — text chat is functional end-to-end against a local dev
database. Nothing below is deployed to a real environment.

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
- PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`) — `User`,
  `Room`, `RoomMember`, `Message`. Bcrypt password hashing and JWT-based
  sessions (`src/modules/auth`). Verified against a local dev cluster only;
  not yet provisioned for a deployed environment — see `RISK_REGISTER.md`.
- `src/modules/rooms`: create/list rooms, join/leave (REST), message
  history (REST, paginated by `before`/`limit`). A message's `body` is
  stored exactly as typed — no translation or normalization on write (spec
  section 8).
- Yahoo-style public room lobby: `Room.category` (free-text code from
  `ROOM_CATEGORIES`, rendered via `groups.category.<code>` — same
  no-DB-enum pattern as `LOCALE_REGISTRY`) and `Room.isPublic`.
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
- Redis (presence/pub-sub) is still not wired up.

## Frontend (`apps/frontend`)

- React 18 + Vite, `i18next`/`react-i18next` wired to `@molido/i18n`'s locale
  registry and namespace bundles.
- `applyDocumentDirection()` keeps `<html lang dir>` in sync with the active
  locale on boot and on every language switch.

## Realtime media (voice/video, Paltalk-style rooms)

Not yet implemented. Planned: WebRTC with an SFU (mediasoup) so a room
scales past 1:1 calls; Socket.IO carries signaling. This is explicit future
work, not a half-built feature in this PHASE 0 commit.

## Why this stack

- Socket.IO: mature, handles reconnection/room semantics out of the box —
  avoids reinventing presence/room primitives for an MVP.
- mediasoup (planned): self-hostable SFU, avoids per-minute vendor costs of
  managed WebRTC platforms for a Paltalk-style multi-party room.
- PostgreSQL (planned): relational integrity for accounts/rooms/messages;
  Redis (planned): presence and pub/sub across backend instances.

## Explicitly deferred to later phases

- Live socket push of system join/leave events (currently REST-only, visible
  on next history fetch).
- Message edit/delete endpoints (schema has `editedAt`/`deletedAt`; no
  routes yet).
- Refresh tokens, logout, and session revocation.
- WebRTC/SFU integration.
- Push notification delivery pipeline.
- Admin panel.
- Revenue/billing (ships disabled — `REVENUE_ENABLED=false` — by default).
