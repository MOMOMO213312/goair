import type { Language } from "./translations";

/**
 * Generic AR/EN display fallback for business content stored in the
 * database (packages, subscriptions, addon services, announcements,
 * payment methods, trip/destination names). The Arabic value is always
 * the source of truth and is used as-is for any filtering/matching key
 * (see country-labels.ts for the same pattern applied to `country`).
 * This only controls what's *shown* when the interface is in English —
 * falls back to the Arabic value if no translation has been filled in
 * yet, so nothing ever renders empty.
 */
export function localize(ar: string, en: string | null | undefined, language: Language): string {
  if (language === "en" && en && en.trim().length > 0) return en;
  return ar;
}

/** Same fallback rule, for string-array fields (e.g. `features`). */
export function localizeList(
  ar: string[],
  en: string[] | null | undefined,
  language: Language,
): string[] {
  if (language === "en" && en && en.length > 0) return en;
  return ar;
}
