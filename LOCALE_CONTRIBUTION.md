# Adding or Editing a Locale

## Adding a brand-new language

1. Add a row to `LOCALE_REGISTRY` in `packages/i18n/src/core/registry.ts`
   (code, `intlTag`, `direction`, native/English names). Set `enabled: false`
   until translations are complete.
2. Create `packages/i18n/src/locales/<code>/` with all 9 namespace files
   listed in `LOCALE_NAMESPACES` (`common.json`, `auth.json`, `chat.json`,
   `groups.json`, `settings.json`, `errors.json`, `notifications.json`,
   `ai.json`, `revenue.json`), keyed identically to `en/`.
3. Run `npm run i18n:validate`. It only enforces parity for locales listed in
   `REQUIRED_LOCALES` in `validate-locales.js` (currently `fa`, `en`) — add
   the new code there once you're ready to make it a CI-blocking requirement.
4. Flip `enabled: true` in the registry once translations and the direction
   are verified end-to-end (buddy list, chat, settings, notifications).
5. Never add per-language `if`/`switch` branches in application code — the
   registry and namespace files are the only places language-specific data
   should live.

## Editing an existing locale

1. Edit the relevant `packages/i18n/src/locales/<code>/<namespace>.json` file.
2. Keep the key stable — keys are semantic (`chat.send`), not sentence-based.
   Never rename a key just because the wording changed.
3. If you add a `{placeholder}`, add it to every other locale's copy of the
   same key too, or CI will fail.
4. Run `npm run i18n:validate`.

## Key naming

- `namespace.subject` or `namespace.subject.verb`, e.g. `chat.send`,
  `auth.invalid_credentials`, `group.leave`.
- Never derive a key from the current English sentence
  (`send_message_text`, `click_here`) — sentences change, keys shouldn't.
- Plural variants use the `.one`/`.other` (etc., per CLDR) suffix on the base
  key: `chat.new_messages.one` / `chat.new_messages.other`.
