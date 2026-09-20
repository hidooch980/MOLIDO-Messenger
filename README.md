# MOLIDO Messenger

A real-time text, voice and video messenger (Yahoo Messenger / Paltalk style) —
buddy lists, rooms, presence, and multi-party voice/video calls — built
**multilingual from the architectural root** (see `I18N_ARCHITECTURE.md`).

## Status

PHASE 0 — Discovery & foundational architecture. See `MASTER_STATE.md` for the
current verified/unverified status of every subsystem.

## Monorepo layout

```
packages/
  i18n/           Locale registry, resolution, formatting, translation core.
                  Shared by both backend and frontend — the single source of
                  truth for supported languages, direction, and error codes.
apps/
  backend/        Node.js + Express + Socket.IO API and realtime server.
  frontend/       React + Vite web client.
```

## Stack (PHASE 0 decision)

- **Backend:** Node.js, TypeScript, Express, Socket.IO (text chat + presence),
  WebRTC/SFU for voice+video (mediasoup — to be integrated in a later phase).
- **Data:** PostgreSQL (accounts, rooms, messages) + Redis (presence, pub/sub)
  — not yet provisioned; see `RISK_REGISTER.md`.
- **Frontend:** React, TypeScript, Vite, i18next/react-i18next.
- **i18n:** `@molido/i18n` workspace package — locale registry, resolution
  order, RTL/LTR direction mapping, `Intl`-based date/number/currency/plural
  formatting, and stable backend error codes.

## Getting started

```bash
npm install
npm run i18n:validate   # locale parity/placeholder CI gate
npm run dev:backend     # http://localhost:4000
npm run dev:frontend    # http://localhost:5173
```

## Multilingual requirement

Internationalization is a root architectural constraint, not a feature to add
later. Read `I18N_ARCHITECTURE.md` before touching any user-facing string in
any layer (frontend, backend, notifications, emails, AI, admin).
