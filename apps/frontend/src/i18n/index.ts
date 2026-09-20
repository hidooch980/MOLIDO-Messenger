import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  applyDocumentDirection,
  ENABLED_LOCALES,
  LOCALE_NAMESPACES,
  resolveLocale,
  type LocaleCode,
} from "@molido/i18n";

const STORAGE_KEY = "molido.locale";

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// A dynamic `import(`@molido/i18n/locales/${locale}/${ns}.json`)` looks
// natural but Vite's dev server (unlike its Rollup-based production build,
// which happened to inline it) can't resolve a subpath-export pattern from
// a runtime template literal — it 404s only in `npm run dev`, not
// `vite build`. `import.meta.glob` is Vite's documented, dev-and-build-safe
// way to import a whole directory of files matching a pattern.
const localeModules = import.meta.glob<{ default: Record<string, string> }>(
  "../../../../packages/i18n/src/locales/*/*.json",
  { eager: true }
);

const ALL_BUNDLES: Record<string, Record<string, Record<string, string>>> = {};
for (const [path, mod] of Object.entries(localeModules)) {
  const match = /locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const [, locale, namespace] = match;
  (ALL_BUNDLES[locale] ??= {})[namespace] = mod.default;
}

function bundleFor(locale: LocaleCode): Record<string, Record<string, string>> {
  return ALL_BUNDLES[locale] ?? {};
}

/** Must be awaited once, before the app renders (see `main.tsx`). */
export async function initI18n(): Promise<LocaleCode> {
  const initialLocale = resolveLocale({
    explicitUserChoice: readStoredLocale(),
    accountPreference: null, // filled in once the authenticated user's profile loads
    deviceOrBrowserLocales: navigator.languages,
  }) as LocaleCode;

  const resources = Object.fromEntries(ENABLED_LOCALES.map((locale) => [locale, bundleFor(locale)]));

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: "en",
    ns: LOCALE_NAMESPACES,
    defaultNS: "common",
    // packages/i18n's own Translator (core/translate.ts, used server-side)
    // interpolates `{var}`, not i18next's default `{{var}}` — every JSON
    // bundle is written once for both consumers, so i18next must match it.
    interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
  });

  applyDocumentDirection(initialLocale);
  return initialLocale;
}

export async function changeLocale(locale: LocaleCode): Promise<void> {
  if (!i18n.hasResourceBundle(locale, "common")) {
    for (const [ns, resource] of Object.entries(bundleFor(locale))) {
      i18n.addResourceBundle(locale, ns, resource);
    }
  }
  await i18n.changeLanguage(locale);
  applyDocumentDirection(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Local persistence is a convenience only; section 26 requires the
    // durable copy to live server-side once the user is authenticated.
  }
}

export default i18n;
