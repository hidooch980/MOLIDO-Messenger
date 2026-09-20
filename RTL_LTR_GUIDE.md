# RTL / LTR Guide

Status: **IMPLEMENTED (PHASE 0 baseline)**

## Rule

One application tree. Direction is a runtime attribute (`dir="rtl"` /
`dir="ltr"` on `<html>`), never a duplicated RTL build or a per-language
component fork.

`applyDocumentDirection(locale)` (`packages/i18n/src/core/direction.ts`) sets
`lang` and `dir` on `document.documentElement` and is called:
- once at frontend boot (`apps/frontend/src/i18n/index.ts`), and
- on every `changeLocale()` call.

## CSS rules

- Use **logical properties** everywhere: `margin-inline`, `padding-inline`,
  `inset-inline`, `border-inline`, `text-align: start`/`end`.
- Do not use `left`/`right`/hardcoded `margin-left` etc. for layout that
  should mirror with direction. `left`/`right` are acceptable only for
  values that are direction-independent by nature (e.g. a fixed watermark).
- Icons that imply direction (back arrow, chevrons) must flip with `dir`;
  icons that don't (a play button, a checkmark) must not.

## Mixed-direction content (spec section 12)

Chat messages routinely mix scripts: `سلام Hello 123 @user`. Never reverse or
manually reorder characters — rely on the browser's Unicode Bidirectional
Algorithm by rendering text in a plain text node/`<span>` with correct `dir`;
where a message's dominant direction differs from the UI direction, wrap it
with `dir="auto"` so the browser infers it per line, rather than forcing the
UI's direction onto the content.

## Test matrix (spec section 34)

Every major UI feature ships tested against:

| Locale | Direction | Required |
|---|---|---|
| fa | RTL | Yes — baseline |
| en | LTR | Yes — baseline |
| ar, ur | RTL | Critical components only, once enabled |
| de, nl | LTR | Critical components only, once enabled |

## Text expansion (spec section 31)

UI must not be sized to fit English text. Buttons, dialogs, and form labels
use flexible widths (`min-width` + wrapping), not fixed pixel widths derived
from an English string's length. Persian and German strings are typically
longer than their English equivalents and are the practical stress test.
