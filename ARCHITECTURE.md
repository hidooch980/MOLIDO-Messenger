# Architecture

Status: PHASE 0 — foundational scaffold only. Nothing below is deployed.

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
- PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`) — a `User`
  model with bcrypt password hashing and JWT-based sessions
  (`src/modules/auth`). Verified against a local dev cluster only; not yet
  provisioned for a deployed environment — see `RISK_REGISTER.md`.
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

- Rooms/messages schema and migrations.
- Refresh tokens, logout, and session revocation.
- WebRTC/SFU integration.
- Push notification delivery pipeline.
- Admin panel.
- Revenue/billing (ships disabled — `REVENUE_ENABLED=false` — by default).
