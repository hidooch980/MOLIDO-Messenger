# I18N Architecture

Status: **IMPLEMENTED (PHASE 0 baseline)** — `fa` + `en`, structure ready for
`ar`, `ur`, `bal`, `tr`, `de`, `nl`, `fr`, `es` per the product roadmap.

## Source of truth

`packages/i18n` (`@molido/i18n`) is the only place that knows which locales
exist, their direction, and their `Intl` tag. Backend and frontend both
depend on it — neither hardcodes a language list, an `if (locale === 'fa')`
branch, or a `left`/`right` CSS value tied to a specific language.

| Module | File | Responsibility |
|---|---|---|
| Registry | `core/registry.ts` | Declares every locale (enabled or reserved), its direction and native name. Adding a language = adding a row here + a `locales/<code>/*.json` set. |
| Resolver | `core/resolver.ts` | Implements the resolution order in section 3 below. |
| Direction | `core/direction.ts` | Maps locale → `rtl`/`ltr`, applies `lang`/`dir` to the document root. |
| Format | `core/format.ts` | `Intl`-backed date/number/currency/plural formatting — canonical data in, presentation string out. |
| Translate | `core/translate.ts` | Namespaced lookup with pluralization, `{placeholder}` interpolation, and the fallback chain in section 27. |
| Error codes | `core/error-codes.ts` | Stable `ERROR_CODES`/`SYSTEM_EVENT_CODES` shared by backend and frontend — see section 3. |

## 1. Locale resolution order

```
explicit user preference (query param / in-app switch)
  -> authenticated account preference
  -> device / browser language (Accept-Language / navigator.languages)
  -> product default locale (fa)
  -> English fallback (en)
```

Implemented once, in `resolveLocale()`. The backend calls it in
`apps/backend/src/i18n/middleware.ts` per request; the frontend calls it once
at boot in `apps/frontend/src/i18n/index.ts`. Persian being the default
product locale is a business decision, not an assumption that every visitor
reads Persian — the chain always ends at English.

## 2. Namespaces

Every locale directory has the same 9 files (`LOCALE_NAMESPACES` in
`core/types.ts`): `common`, `auth`, `chat`, `groups`, `settings`, `errors`,
`notifications`, `ai`, `revenue`. CI (`validate-locales.js`) fails the build
if `fa` and `en` diverge in keys or in a key's `{placeholder}` set.

## 3. Backend error/event codes, not sentences

The backend never returns a rendered English sentence. It returns a stable
code (`AUTH_INVALID_CREDENTIALS`, `MESSAGE_FORBIDDEN`, `RATE_LIMITED`, …) and
the client renders `errors.<CODE>` in the viewer's own locale. The same
pattern covers chat system messages (`GROUP_MEMBER_JOINED`, …) — see
`error-codes.ts` and `chat.json`'s `system.*` keys. Clients must never parse
an English string to decide behavior.

## 4. User content vs. system translation

User-generated messages are stored and transmitted exactly as typed (UTF-8,
untouched). Machine translation, if enabled later, is derived data displayed
alongside the original — never a silent replacement (spec sections 8, 21).

## 5. Canonical data, localized presentation

Timestamps are stored/transmitted as ISO-8601 UTC and formatted at the
presentation layer via `formatDateTime()`. Currency amounts are stored as
integer minor units, formatted via `formatCurrency()` with an explicit
currency code — never a hardcoded `$`/`€`/`تومان` in business logic.

## 6. What's still open (tracked in `RISK_REGISTER.md`)

- Email templates per locale (`emails/<locale>/…`) — not yet built.
- Push notification payload localization pipeline — not yet built.
- Search tokenization/stemming per language — not yet built.
- Additional locales beyond fa/en — registry has reserved rows, no bundles yet.
- Confusable-character username protection — not yet specified.
