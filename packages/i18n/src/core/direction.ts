import type { LocaleCode, TextDirection } from "./types.js";
import { getLocaleDefinition } from "./registry.js";

export function getDirection(locale: LocaleCode): TextDirection {
  return getLocaleDefinition(locale).direction;
}

/**
 * Applies locale + direction to the document root. Call on init and on every
 * language change. Never duplicate the app tree per direction — layout must
 * flip via this attribute + logical CSS properties (see RTL_LTR_GUIDE.md).
 */
export function applyDocumentDirection(locale: LocaleCode, doc: Document = document): void {
  const direction = getDirection(locale);
  doc.documentElement.setAttribute("lang", locale);
  doc.documentElement.setAttribute("dir", direction);
}
