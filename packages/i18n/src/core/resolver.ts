import { DEFAULT_LOCALE, FALLBACK_LOCALE, type LocaleCode, type LocaleResolutionInput } from "./types.js";
import { ENABLED_LOCALES, isLocaleCode } from "./registry.js";

/**
 * Resolution order (spec, section 3):
 *   explicit user preference -> authenticated account preference ->
 *   device/browser language -> system default -> English fallback.
 *
 * "System default" is the product-level DEFAULT_LOCALE (Persian), not an
 * assumption that every visitor understands it — it's just where the
 * chain bottoms out before the universal English fallback.
 */
export function resolveLocale(input: LocaleResolutionInput): LocaleCode {
  const candidates: (string | null | undefined)[] = [
    input.explicitUserChoice,
    input.accountPreference,
    ...(input.deviceOrBrowserLocales ?? []),
    DEFAULT_LOCALE,
    FALLBACK_LOCALE,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeTag(candidate);
    if (normalized && isLocaleCode(normalized) && ENABLED_LOCALES.includes(normalized)) {
      return normalized;
    }
  }

  return FALLBACK_LOCALE;
}

/** "en-US" -> "en", "fa_IR" -> "fa" */
function normalizeTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return tag.split(/[-_]/)[0]?.toLowerCase() ?? null;
}

/** Parses a raw `Accept-Language` header into an ordered list of primary tags. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter((tag): tag is string => Boolean(tag));
}
