# Translation Testing

## Automated (CI gate)

`npm run i18n:validate` (`packages/i18n/scripts/validate-locales.js`), run in
`.github/workflows/ci.yml` before build, checks for the enabled locale set:

- valid JSON in every namespace file
- identical key sets across locales (no key present in one and missing in
  another)
- identical `{placeholder}` sets for the same key across locales
- (missing today, tracked in `RISK_REGISTER.md`: duplicate-key detection
  pre-`JSON.parse`, since `JSON.parse` silently keeps only the last
  duplicate)

## Manual / human-like test matrix (spec sections 34–35)

For every major phase, verify each scenario against the actual running app,
not just unit tests:

| Scenario | Device lang | UI lang | Message lang | Expect |
|---|---|---|---|---|
| A | fa | fa | fa | RTL layout, Persian everywhere |
| B | en | en | en | LTR layout, English everywhere |
| C | any | fa | en | UI stays RTL/Persian; message renders LTR inline via `dir="auto"` |
| D | any | en | fa | UI stays LTR/English; message renders RTL inline via `dir="auto"` |
| E | mixed | per-user | mixed | Each participant's own client renders its own UI locale; system messages (`GROUP_MEMBER_JOINED`, etc.) render in the *viewer's* locale, not the actor's |

Cover: buttons, dialogs, forms, notifications, error banners, empty states,
loading states — not just the happy-path screen.

## Regression requirement

After every phase, re-run the fa/RTL and en/LTR rows above plus whatever
manual checks the previous phase's report listed, before locking the phase.
A new feature must not silently regress an existing language.

## Known gaps (do not report as passing until closed)

- No automated screen-reader/RTL accessibility test yet (spec section 24).
- No automated visual text-expansion regression test yet (spec section 31).
- No unicode confusable-username test yet (spec section 23).
