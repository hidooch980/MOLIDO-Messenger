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

// Statically bundling fa+en keeps PHASE 0 simple; section 33 (lazy loading /
// locale chunking) applies once more locales are enabled and this list grows.
async function loadBundle(locale: LocaleCode): Promise<Record<string, Record<string, string>>> {
  const entries = await Promise.all(
    LOCALE_NAMESPACES.map(async (ns) => [ns, (await import(`@molido/i18n/locales/${locale}/${ns}.json`)).default] as const)
  );
  return Object.fromEntries(entries);
}

/** Must be awaited once, before the app renders (see `main.tsx`). */
export async function initI18n(): Promise<LocaleCode> {
  const initialLocale = resolveLocale({
    explicitUserChoice: readStoredLocale(),
    accountPreference: null, // filled in once the authenticated user's profile loads
    deviceOrBrowserLocales: navigator.languages,
  }) as LocaleCode;

  const resources = Object.fromEntries(
    await Promise.all(ENABLED_LOCALES.map(async (locale) => [locale, await loadBundle(locale)] as const))
  );

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: "en",
    ns: LOCALE_NAMESPACES,
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

  applyDocumentDirection(initialLocale);
  return initialLocale;
}

export async function changeLocale(locale: LocaleCode): Promise<void> {
  if (!i18n.hasResourceBundle(locale, "common")) {
    const bundle = await loadBundle(locale);
    for (const [ns, resource] of Object.entries(bundle)) {
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
