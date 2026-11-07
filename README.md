# MOLIDO Messenger

A multilingual real-time messenger with buddy lists, presence, public rooms, persistent chat history, message editing/deletion, and 1:1 WebRTC voice/video calling.

## Verified project status

The repository's current implementation is beyond the original Phase 0 foundation. The main branch includes the completed and CI-verified Phase 1–10 work recorded in [MASTER_STATE.md](./MASTER_STATE.md), including:

- PostgreSQL-backed users, rooms, memberships, and messages.
- Authenticated REST and Socket.IO access using the same JWT validation.
- Allowlisted REST/Socket.IO CORS and startup validation of the JWT signing secret.
- Idempotent message submission with client-generated message IDs and durable server acknowledgement.
- Buddy/friend requests, Redis-backed presence, and friend-only nudges.
- Public room discovery, membership enforcement, live join/leave events, and message history.
- Message edit/delete with ownership checks and live room updates.
- Socket event validation and per-user rate limits for chat messages, nudges, and call invitations.
- React/Vite client with Persian/English locale support and 1:1 WebRTC signaling/media flows.

The latest verified main-branch commit is `2b2494f5d50140e3c3fd3e510571769af970db9e`. GitHub Actions run [42386045386](https://github.com/hidooch980/MOLIDO-Messenger/actions/runs/42386045386) completed successfully after the latest merge.

## Important limitations — not production-ready yet

- End-to-end encryption is **not implemented**. The server can read message contents.
- Refresh-token rotation, logout, and server-side session revocation are not implemented.
- The browser does not yet have a durable, reload-persistent offline message outbox.
- Delivery/read receipts are not implemented.
- TURN is not configured; calls may fail across restrictive NATs/firewalls.
- Group voice/video calling (SFU/mediasoup) is not implemented.
- Redis-backed Socket.IO multi-instance scaling and distributed rate limiting are not implemented.
- Production PostgreSQL/Redis provisioning, backup/restore, monitoring, and deployment have not been completed.
- No production release or deployment is claimed.

See [MASTER_STATE.md](./MASTER_STATE.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [RISK_REGISTER.md](./RISK_REGISTER.md) for detailed status and risks.

## Monorepo layout

```
packages/
  i18n/           Shared locale registry, formatting, and stable error codes.
apps/
  backend/        Node.js + TypeScript + Express + Socket.IO + Prisma.
  frontend/       React + TypeScript + Vite web client.
```

## Stack

- **Backend:** Node.js, TypeScript, Express, Socket.IO.
- **Data:** PostgreSQL via Prisma; Redis for presence.
- **Frontend:** React, TypeScript, Vite, i18next/react-i18next.
- **Calls:** 1:1 WebRTC signaling and peer media; TURN and group SFU remain future work.
- **Internationalization:** shared `@molido/i18n` package with Persian (RTL) and English (LTR) support.

## Getting started

```bash
npm install
npm run i18n:validate
npm run dev:backend
npm run dev:frontend
```

Configure environment variables using `.env.example`. Use a unique random `JWT_SECRET` of at least 32 characters, and configure `CORS_ORIGINS` explicitly for production. Do not commit secrets.

## Roadmap priorities

1. Refresh-token rotation, logout, and server-side session revocation.
2. Private-room invitation and membership workflows.
3. Durable offline outbox and delivery/read receipts.
4. TURN deployment and call reliability; then group-call SFU architecture.
5. End-to-end encryption design using a vetted protocol/library (no custom cryptography).
6. Production infrastructure, backups, observability, scaling, and release automation.

Do not treat a successful CI run as proof of production deployment, cross-network call reliability, or end-to-end encryption.
