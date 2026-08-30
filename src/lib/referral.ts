const STORAGE_KEY = "goair:partner_ref";

/** How long a captured referral code stays valid for attribution. */
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type StoredReferral = {
  code: string;
  expiresAt: number;
};

/** Trim and reject empty referral codes. */
export function normalizeReferralCode(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

/**
 * Read `?ref=` from the current URL and persist it for the booking.
 *
 * Uses localStorage (not sessionStorage) with a 30-day expiry: a
 * passenger who opens the airline's link today may not finish
 * booking until days later, possibly on a different tab or after
 * closing the browser — the commission attribution shouldn't be
 * lost just because the session ended.
 */
export function captureReferralFromUrl(search?: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const code = normalizeReferralCode(params.get("ref"));
  if (code) {
    const record: StoredReferral = { code, expiresAt: Date.now() + ATTRIBUTION_WINDOW_MS };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage unavailable (private mode, quota, etc.) — fail silently,
      // referral just won't be attributed for this visit.
    }
  }
  return code;
}

/** Referral code saved for this browser, if still within the attribution window. */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<StoredReferral>;
    if (!record.code || !record.expiresAt || record.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalizeReferralCode(record.code);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
