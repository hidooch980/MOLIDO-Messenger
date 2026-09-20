#!/usr/bin/env node
// Locale CI gate (spec section 28). Fails the build on:
//   - invalid JSON
//   - keys present in one enabled locale but missing in another
//   - placeholder mismatches between a key's translations across locales
// Run: node packages/i18n/scripts/validate-locales.js

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "src", "locales");

// Only locales that are actually shipped need parity today; reserved
// (not-yet-enabled) locales in registry.ts are exempt until populated.
const REQUIRED_LOCALES = ["fa", "en"];
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

function extractPlaceholders(template) {
  return [...template.matchAll(PLACEHOLDER_PATTERN)].map((m) => m[1]).sort().join(",");
}

function loadNamespace(locale, file) {
  const filePath = path.join(LOCALES_DIR, locale, file);
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

function main() {
  const errors = [];
  const namespaceFiles = readdirSync(path.join(LOCALES_DIR, REQUIRED_LOCALES[0])).filter((f) => f.endsWith(".json"));

  for (const file of namespaceFiles) {
    const bundles = {};
    for (const locale of REQUIRED_LOCALES) {
      try {
        bundles[locale] = loadNamespace(locale, file);
      } catch (err) {
        errors.push(err.message);
      }
    }
    if (Object.keys(bundles).length !== REQUIRED_LOCALES.length) continue;

    const [base, ...rest] = REQUIRED_LOCALES;
    const baseKeys = new Set(Object.keys(bundles[base]));
    for (const locale of rest) {
      const localeKeys = new Set(Object.keys(bundles[locale]));
      for (const key of baseKeys) {
        if (!localeKeys.has(key)) errors.push(`[${file}] key "${key}" exists in "${base}" but missing in "${locale}"`);
      }
      for (const key of localeKeys) {
        if (!baseKeys.has(key)) errors.push(`[${file}] key "${key}" exists in "${locale}" but missing in "${base}"`);
      }
    }

    for (const key of baseKeys) {
      const signatures = REQUIRED_LOCALES.filter((l) => key in bundles[l]).map((l) => [l, extractPlaceholders(bundles[l][key])]);
      const [, firstSig] = signatures[0];
      for (const [locale, sig] of signatures) {
        if (sig !== firstSig) {
          errors.push(`[${file}] key "${key}" has mismatched placeholders in "${locale}" ({${sig}} vs {${firstSig}})`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\nLocale validation failed with ${errors.length} error(s):\n`);
    for (const e of errors) console.error(" - " + e);
    process.exit(1);
  }

  console.log(`Locale validation passed for ${REQUIRED_LOCALES.join(", ")} across ${namespaceFiles.length} namespace file(s).`);
}

main();
