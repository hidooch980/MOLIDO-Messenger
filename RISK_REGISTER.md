# Risk Register

| # | Risk | Impact | Mitigation / Status |
|---|---|---|---|
| 1 | No database provisioned yet | Blocks any persistence-dependent feature (accounts, messages, rooms) | Planned PostgreSQL + Redis; not started. |
| 2 | `validate-locales.js` doesn't detect duplicate JSON keys pre-parse | A duplicate key could silently drop a translation (last write wins under `JSON.parse`) | Add a pre-parse duplicate-key scan in a follow-up. |
| 3 | No automated RTL/LTR visual regression testing | A layout regression in a non-default direction could ship unnoticed | Manual test matrix documented in `TRANSLATION_TESTING.md`; automate later (e.g. Playwright + screenshot diff per locale). |
| 4 | No WebRTC/SFU integration | Voice/video (the Paltalk-style requirement) is not yet functional | Explicit PHASE 1+ work; mediasoup planned in `ARCHITECTURE.md`. |
| 5 | Only fa/en have translated content; ar/ur/bal/tr/de/nl/fr/es are registry-only | Expanding language coverage requires real translation work, not just code | Registry/namespace structure already supports it without redesign (spec section 42's core requirement). |
| 6 | No confusable-username protection (spec section 23) | Cross-script lookalike usernames could enable impersonation | Not designed yet; needed before public registration ships. |
| 7 | No email/push delivery pipeline for localized notifications | `notifications.json` keys exist but nothing sends a real email/push yet | Deferred to a phase that adds an email/push provider. |
| 8 | Revenue flag not wired | Spec requires `REVENUE_ENABLED=false` as the enforced default | `revenue.json` namespace exists; the flag and gating logic don't yet — add before any billing UI work starts. |
| 9 | CI workflow untested on GitHub Actions | `.github/workflows/ci.yml` has only been exercised locally in this session | Verify on first push/PR. |
