import type { Language } from "./translations";

/**
 * Country values are stored in Arabic in the database ("مصر" / "لبنان") and used
 * as-is everywhere as the filtering/query value (search params, RPC args, DB
 * comparisons) — that must never change. This map only affects the label shown
 * to the visitor when the UI is in English; the underlying value passed around
 * the app stays the raw Arabic string either way.
 */
const COUNTRY_LABELS_EN: Record<string, string> = {
  مصر: "Egypt",
  لبنان: "Lebanon",
};

export function getCountryLabel(country: string, language: Language): string {
  if (language === "en") {
    return COUNTRY_LABELS_EN[country] ?? country;
  }
  return country;
}
