import type { LocaleCode } from "./types.js";
import { getLocaleDefinition } from "./registry.js";

/**
 * All locale-aware presentation goes through here — canonical data (UTC
 * timestamps, machine-readable numbers) is stored and transmitted untouched;
 * only the presentation layer formats it per section 14/16.
 */

export function formatDateTime(isoTimestamp: string, locale: LocaleCode, options?: Intl.DateTimeFormatOptions): string {
  const { intlTag } = getLocaleDefinition(locale);
  return new Intl.DateTimeFormat(intlTag, options ?? { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(isoTimestamp)
  );
}

export function formatNumber(value: number, locale: LocaleCode, options?: Intl.NumberFormatOptions): string {
  const { intlTag } = getLocaleDefinition(locale);
  return new Intl.NumberFormat(intlTag, options).format(value);
}

/** Locale-aware currency display; business logic must never hardcode a symbol (spec section 16). */
export function formatCurrency(amountMinorUnits: number, currencyCode: string, locale: LocaleCode): string {
  const { intlTag } = getLocaleDefinition(locale);
  return new Intl.NumberFormat(intlTag, { style: "currency", currency: currencyCode }).format(amountMinorUnits / 100);
}

export function getPluralCategory(count: number, locale: LocaleCode): Intl.LDMLPluralRule {
  const { intlTag } = getLocaleDefinition(locale);
  return new Intl.PluralRules(intlTag).select(count);
}
