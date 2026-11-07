# Security baseline

## Implemented controls

- REST and Socket.IO browser origins are restricted by the comma-separated `CORS_ORIGINS` allowlist. The development default is limited to localhost Vite origins; production deployments must set their exact HTTPS frontend origins.
- JWT signing refuses missing, placeholder, or shorter-than-32-character secrets. Generate a unique secret for each environment and keep it outside source control.
- Socket connections continue to require the same verified JWT as REST requests.
- CI runs dependency auditing and now exercises database-backed room/message flows against an ephemeral PostgreSQL service.

## End-to-end encryption status

**End-to-end encryption is not implemented.** Messages are currently persisted as server-readable plaintext in PostgreSQL and delivered through the authenticated application server. Do not advertise chats as E2EE or use this build for conversations requiring E2EE confidentiality.

A safe E2EE phase must select and integrate a reviewed protocol/library (rather than custom cryptography), define device identity and key verification, handle multi-device key changes and recovery, and specify attachment encryption and metadata leakage. It also needs independent security review and interoperability tests before being enabled by default.

## Deployment checklist

- Set a unique `JWT_SECRET` (at least 32 characters) and exact `CORS_ORIGINS`.
- Terminate TLS at a trusted reverse proxy; do not expose the backend directly to the public internet.
- Restrict PostgreSQL and Redis to private network access; use separate least-privilege credentials.
- Rotate secrets after suspected exposure and keep production secrets out of GitHub workflow logs.
