export type LocaleCode =
  | "fa"
  | "en"
  | "ar"
  | "ur"
  | "bal"
  | "tr"
  | "de"
  | "nl"
  | "fr"
  | "es";

export type TextDirection = "rtl" | "ltr";

export interface LocaleDefinition {
  code: LocaleCode;
  /** BCP-47 tag used for Intl APIs, e.g. "fa-IR" */
  intlTag: string;
  direction: TextDirection;
  /** Native display name, shown in the language switcher regardless of current UI locale */
  nativeName: string;
  /** English display name, used in admin/dev tooling */
  englishName: string;
  /** Whether this locale ships enabled in production, vs. reserved for future rollout */
  enabled: boolean;
}

export type LocaleNamespace =
  | "common"
  | "auth"
  | "chat"
  | "groups"
  | "friends"
  | "calls"
  | "settings"
  | "errors"
  | "notifications"
  | "ai"
  | "revenue";

export const LOCALE_NAMESPACES: LocaleNamespace[] = [
  "common",
  "auth",
  "chat",
  "groups",
  "friends",
  "calls",
  "settings",
  "errors",
  "notifications",
  "ai",
  "revenue",
];

export type TranslationBundle = Record<string, string>;
export type NamespacedBundles = Partial<Record<LocaleNamespace, TranslationBundle>>;

/** Resolution inputs, in priority order (highest first). Any may be absent. */
export interface LocaleResolutionInput {
  explicitUserChoice?: string | null;
  accountPreference?: string | null;
  deviceOrBrowserLocales?: readonly string[] | null;
}

export const DEFAULT_LOCALE: LocaleCode = "fa";
export const FALLBACK_LOCALE: LocaleCode = "en";
