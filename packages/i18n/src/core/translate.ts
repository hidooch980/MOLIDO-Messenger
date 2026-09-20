import type { LocaleCode, LocaleNamespace, NamespacedBundles } from "./types.js";
import { FALLBACK_LOCALE } from "./types.js";
import { getPluralCategory } from "./format.js";

export type LocaleLoader = (locale: LocaleCode, namespace: LocaleNamespace) => Promise<NamespacedBundles[LocaleNamespace]>;

export interface TranslateOptions {
  count?: number;
  [placeholder: string]: string | number | undefined;
}

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Missing-translation policy (spec section 27): requested locale -> fallback
 * locale -> English -> the key itself (never `undefined`/`null` shown to a user).
 */
export class Translator {
  private cache = new Map<string, NamespacedBundles[LocaleNamespace]>();

  constructor(private readonly loader: LocaleLoader, private readonly fallbackChain: LocaleCode[] = [FALLBACK_LOCALE]) {}

  private cacheKey(locale: LocaleCode, ns: LocaleNamespace) {
    return `${locale}:${ns}`;
  }

  private async loadBundle(locale: LocaleCode, ns: LocaleNamespace) {
    const key = this.cacheKey(locale, ns);
    if (!this.cache.has(key)) {
      const bundle = await this.loader(locale, ns);
      this.cache.set(key, bundle);
    }
    return this.cache.get(key);
  }

  async t(locale: LocaleCode, namespace: LocaleNamespace, key: string, options: TranslateOptions = {}): Promise<string> {
    const chain = [locale, ...this.fallbackChain.filter((l) => l !== locale)];

    let raw: string | undefined;
    for (const candidate of chain) {
      const bundle = await this.loadBundle(candidate, namespace);
      const flatKey = pluralizedKey(bundle, key, options.count, candidate);
      if (bundle && flatKey in bundle) {
        raw = bundle[flatKey];
        break;
      }
    }

    if (raw === undefined) {
      // Never leak "undefined"/the raw key layout to end users beyond this
      // last-resort literal; CI (validate-locales.js) is what should catch
      // this before it ships.
      return key;
    }

    return interpolate(raw, options);
  }
}

function pluralizedKey(
  bundle: NamespacedBundles[LocaleNamespace] | undefined,
  key: string,
  count: number | undefined,
  locale: LocaleCode
): string {
  if (count === undefined || !bundle) return key;
  const category = getPluralCategory(count, locale);
  const pluralKey = `${key}.${category}`;
  return pluralKey in bundle ? pluralKey : key;
}

function interpolate(template: string, options: TranslateOptions): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, name) => {
    const value = options[name];
    return value === undefined ? match : String(value);
  });
}

/** CI-usable placeholder extraction, shared with scripts/validate-locales.js semantics. */
export function extractPlaceholders(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER_PATTERN)].map((m) => m[1]).sort();
}
