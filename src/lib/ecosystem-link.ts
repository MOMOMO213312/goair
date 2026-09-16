/**
 * Captures ecosystem-referral params (e.g. from a TripRing deep link) so a
 * booking created later on GoAir can be tagged with its true origin.
 *
 * Mirrors `referral.ts` on purpose: same storage strategy (localStorage,
 * 30-day attribution window), same "fail silently if storage is unavailable"
 * behavior, kept as a *separate* key/module because referral (`?ref=` —
 * commission attribution to an airline/agency `partners` row) and ecosystem
 * origin (`?source=` + `?pnr=` — which platform/PNR this passenger's journey
 * started from) are two independent concepts that can both be present on the
 * same booking.
 *
 * IMPORTANT — verified directly against the live `create_booking_safe` /
 * `create_private_booking_safe` signatures on 2026-09-16 via
 * `pg_get_function_identity_arguments`. The real parameter is
 * `p_external_booking_reference` — **not** `p_pnr` as README §6 describes it
 * (the README's plain-English gloss doesn't match the actual column/param
 * name; this is exactly the kind of mismatch that broke every booking call
 * once before, so it was checked here rather than trusted from the doc).
 * `p_external_platform` is confirmed correct as-is.
 */

const STORAGE_KEY = "goair:ecosystem_link";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matches referral.ts

/** Platform identifiers `create_booking_safe` is confirmed to accept for `p_external_platform`. */
export const KNOWN_EXTERNAL_PLATFORMS = ["tripring"] as const;
export type ExternalPlatform = (typeof KNOWN_EXTERNAL_PLATFORMS)[number];

type StoredEcosystemLink = {
  platform: string;
  pnr: string | null;
  expiresAt: number;
};

function normalize(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Read `?source=` (platform) and `?pnr=` from the current URL and persist
 * them for whichever booking the passenger completes next.
 *
 * Only stores a value when `source` is present and recognized — an unknown
 * or missing `source` never overwrites a previously captured, still-valid
 * link, so a passenger who lands on an unrelated page later doesn't lose
 * attribution captured from the original TripRing link.
 */
export function captureEcosystemLinkFromUrl(search?: string): StoredEcosystemLink | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const platform = normalize(params.get("source"))?.toLowerCase() ?? null;
  if (!platform || !KNOWN_EXTERNAL_PLATFORMS.includes(platform as ExternalPlatform)) return null;

  const record: StoredEcosystemLink = {
    platform,
    pnr: normalize(params.get("pnr")),
    expiresAt: Date.now() + ATTRIBUTION_WINDOW_MS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently, same
    // as referral.ts; the booking still succeeds, just without this tag.
  }
  return record;
}

/** Ecosystem link saved for this browser, if still within the attribution window. */
export function getStoredEcosystemLink(): { platform: string; pnr: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<StoredEcosystemLink>;
    if (!record.platform || !record.expiresAt || record.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { platform: record.platform, pnr: record.pnr ?? null };
  } catch {
    return null;
  }
}

export function clearStoredEcosystemLink(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
