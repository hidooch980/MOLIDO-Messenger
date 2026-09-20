# Risk Register

| # | Risk | Impact | Mitigation / Status |
|---|---|---|---|
| 1 | PostgreSQL only verified on a local dev cluster | No deployed environment has a real, provisioned database yet | PHASE 1 added schema + migration + working auth against local Postgres 16; production/staging provisioning still open. Redis (presence/pub-sub) still not started. |
| 2 | `validate-locales.js` doesn't detect duplicate JSON keys pre-parse | A duplicate key could silently drop a translation (last write wins under `JSON.parse`) | Add a pre-parse duplicate-key scan in a follow-up. |
| 3 | No automated RTL/LTR visual regression testing | A layout regression in a non-default direction could ship unnoticed | Manual test matrix documented in `TRANSLATION_TESTING.md`; automate later (e.g. Playwright + screenshot diff per locale). |
| 4 | No WebRTC/SFU integration | Voice/video (the Paltalk-style requirement) is not yet functional | Explicit PHASE 1+ work; mediasoup planned in `ARCHITECTURE.md`. |
| 5 | Only fa/en have translated content; ar/ur/bal/tr/de/nl/fr/es are registry-only | Expanding language coverage requires real translation work, not just code | Registry/namespace structure already supports it without redesign (spec section 42's core requirement). |
| 6 | No confusable-username protection (spec section 23) | Cross-script lookalike usernames could enable impersonation | Not designed yet; needed before public registration ships. |
| 7 | No email/push delivery pipeline for localized notifications | `notifications.json` keys exist but nothing sends a real email/push yet | Deferred to a phase that adds an email/push provider. |
| 8 | Revenue flag not wired | Spec requires `REVENUE_ENABLED=false` as the enforced default | `revenue.json` namespace exists; the flag and gating logic don't yet — add before any billing UI work starts. |
| 9 | CI workflow untested on GitHub Actions | `.github/workflows/ci.yml` has only been exercised locally in this session | Verify on first push/PR. |
| 10 | No refresh-token/session-revocation | A leaked 7-day JWT cannot be invalidated before it expires | Acceptable for PHASE 1 development; must be closed before any production auth exposure. |
| 11 | Registration restricts usernames to ASCII alphanumeric/underscore | Sidesteps rather than solves spec section 23 (cross-script confusable usernames); also blocks legitimate non-Latin usernames | Needs a deliberate Unicode-username design (normalization + confusable-skeleton check) before loosening the current restriction. |
| 12 | System join/leave events aren't pushed live over the socket | A connected client only learns "X joined/left" on its next history fetch, not in real time | Deliberate PHASE 2 scope cut to avoid coupling REST route handlers to the Socket.IO server instance; revisit once presence/Redis pub-sub exists so any backend instance can broadcast it. |
| 13 | No message edit/delete endpoints | Schema (`editedAt`/`deletedAt`) and translation keys (`chat.system.MESSAGE_EDITED/DELETED`) exist, but nothing lets a user actually edit or delete a message | Add routes + socket events in a follow-up phase; straightforward given the existing membership/ownership checks in `rooms/service.ts`. |
| 14 | Socket.IO server has one `io.use()` auth check but no per-message rate limiting | A malicious/buggy client could flood `chat:message` | Add rate limiting (e.g. a token bucket per user) before any public exposure. |
| 15 | No invite mechanism for private rooms | A private room (`isPublic: false`) can only gain members via direct DB/owner action today — there's no invite link, code, or "add user" endpoint | Needed before private rooms are usable by real users; candidate PHASE 3 work. |
| 16 | Room categories are a fixed compile-time list (`ROOM_CATEGORIES`) | Adding/renaming a category requires a code change + deploy, not an admin action | Acceptable for PHASE 2's scope; revisit if/when an admin panel exists. |
