import type { LocaleCode, LocaleDefinition } from "./types.js";

/**
 * Every supported/planned locale is declared here, and nowhere else.
 * Adding a language means adding a row here + a locales/<code>/*.json set —
 * never adding if/switch branches in application code.
 */
export const LOCALE_REGISTRY: Record<LocaleCode, LocaleDefinition> = {
  fa: { code: "fa", intlTag: "fa-IR", direction: "rtl", nativeName: "فارسی", englishName: "Persian", enabled: true },
  en: { code: "en", intlTag: "en-US", direction: "ltr", nativeName: "English", englishName: "English", enabled: true },
  ar: { code: "ar", intlTag: "ar-SA", direction: "rtl", nativeName: "العربية", englishName: "Arabic", enabled: false },
  ur: { code: "ur", intlTag: "ur-PK", direction: "rtl", nativeName: "اردو", englishName: "Urdu", enabled: false },
  bal: { code: "bal", intlTag: "bal", direction: "rtl", nativeName: "بلوچی", englishName: "Balochi", enabled: false },
  tr: { code: "tr", intlTag: "tr-TR", direction: "ltr", nativeName: "Türkçe", englishName: "Turkish", enabled: false },
  de: { code: "de", intlTag: "de-DE", direction: "ltr", nativeName: "Deutsch", englishName: "German", enabled: false },
  nl: { code: "nl", intlTag: "nl-NL", direction: "ltr", nativeName: "Nederlands", englishName: "Dutch", enabled: false },
  fr: { code: "fr", intlTag: "fr-FR", direction: "ltr", nativeName: "Français", englishName: "French", enabled: false },
  es: { code: "es", intlTag: "es-ES", direction: "ltr", nativeName: "Español", englishName: "Spanish", enabled: false },
};

export const ENABLED_LOCALES: LocaleCode[] = Object.values(LOCALE_REGISTRY)
  .filter((l) => l.enabled)
  .map((l) => l.code);

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && value in LOCALE_REGISTRY;
}

export function getLocaleDefinition(code: LocaleCode): LocaleDefinition {
  return LOCALE_REGISTRY[code];
}
