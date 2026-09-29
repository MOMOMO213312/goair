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
  السعودية: "Saudi Arabia",
  بنجلاديش: "Bangladesh",
  الأردن: "Jordan",
  أوغندا: "Uganda",
};

export function getCountryLabel(country: string, language: Language): string {
  if (language === "en") {
    return COUNTRY_LABELS_EN[country] ?? country;
  }
  return country;
}

/** ISO code for a country's stored Arabic name — used only to call RPCs that
 * are keyed by ISO code (get_country_airports / get_hub_origins). */
const COUNTRY_ISO: Record<string, string> = {
  مصر: "EG",
  لبنان: "LB",
  السعودية: "SA",
  بنجلاديش: "BD",
  الأردن: "JO",
  أوغندا: "UG",
};

export function getCountryIso(country: string): string | null {
  return COUNTRY_ISO[country] ?? null;
}
