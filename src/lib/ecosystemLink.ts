/**
 * Cross-platform booking attribution (GOAIR ecosystem: TripRing, PRFD, and
 * future partners). Mirrors `referral.ts` exactly, but this is *not* the
 * commission/partner-referral mechanism — `p_referral_code` still only
 * matches known rows in `airline_partners`/`travel_agencies`. This module is
 * for an arbitrary external platform passing its own booking reference (or a
 * real Amadeus PNR once TripRing's booking flow goes live) so GOAIR can
 * record `external_links` / `booking.external_platform` without that
 * platform needing to be a registered GOAIR partner at all.
 *
 * Expected URL params: `?ext_platform=tripring&ext_ref=<their reference>`
 */

const STORAGE_KEY = "goair:ecosystem_link";

/** Same attribution window as referral.ts — a passenger may finish booking days later. */
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type EcosystemLink = {
  platform: string;
  reference: string | null;
};

type StoredEcosystemLink = EcosystemLink & {
  expiresAt: number;
};

function normalize(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Read `?ext_platform=`/`?ext_ref=` from the current URL and persist them. */
export function captureEcosystemLinkFromUrl(search?: string): EcosystemLink | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const platform = normalize(params.get("ext_platform"));
  if (!platform) return null;

  const reference = normalize(params.get("ext_ref"));
  const record: StoredEcosystemLink = { platform, reference, expiresAt: Date.now() + ATTRIBUTION_WINDOW_MS };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently, same as referral.ts.
  }
  return { platform, reference };
}

/** Ecosystem link saved for this browser, if still within the attribution window. */
export function getStoredEcosystemLink(): EcosystemLink | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<StoredEcosystemLink>;
    if (!record.platform || !record.expiresAt || record.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { platform: record.platform, reference: record.reference ?? null };
  } catch {
    return null;
  }
}

export function clearStoredEcosystemLink(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
