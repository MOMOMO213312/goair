// Shared helpers for driver/vehicle compliance dates (license, registration, insurance).
// A single source of truth so admin fleet, operator fleet, and the assign-trip UI
// all agree on what "expired" / "expiring soon" means.

export type ComplianceStatus = "expired" | "expiring_soon" | "valid" | "unknown";

export const COMPLIANCE_WARNING_WINDOW_DAYS = 14;

/**
 * Classify a single expiry date relative to a reference date (defaults to today).
 * `null`/undefined expiry means it was never recorded — surfaced as "unknown"
 * rather than silently treated as fine, so ops know it needs following up.
 */
export function getComplianceStatus(
  expiry: string | null | undefined,
  referenceDate: Date = new Date(),
): ComplianceStatus {
  if (!expiry) return "unknown";
  const expiryDate = new Date(`${expiry}T00:00:00`);
  if (Number.isNaN(expiryDate.getTime())) return "unknown";

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((expiryDate.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= COMPLIANCE_WARNING_WINDOW_DAYS) return "expiring_soon";
  return "valid";
}

/** Worst-of across several expiry dates (e.g. a vehicle's registration + insurance). */
export function worstComplianceStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("expiring_soon")) return "expiring_soon";
  if (statuses.includes("unknown")) return "unknown";
  return "valid";
}

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  expired: "منتهية",
  expiring_soon: "قربت تنتهي",
  valid: "سارية",
  unknown: "غير مسجّلة",
};

export const COMPLIANCE_STATUS_BADGE_CLASS: Record<ComplianceStatus, string> = {
  expired: "border-transparent bg-destructive text-destructive-foreground",
  expiring_soon: "border-transparent bg-amber-500 text-white",
  valid: "border-transparent bg-emerald-600 text-white",
  unknown: "border-border/80 bg-muted text-muted-foreground",
};

export function formatExpiryDate(expiry: string | null | undefined): string {
  if (!expiry) return "—";
  return expiry;
}

export type DriverComplianceInput = { license_expiry?: string | null };
export type VehicleComplianceInput = {
  registration_expiry?: string | null;
  insurance_expiry?: string | null;
};

export function driverComplianceStatus(driver: DriverComplianceInput, referenceDate?: Date): ComplianceStatus {
  return getComplianceStatus(driver.license_expiry, referenceDate);
}

export function vehicleComplianceStatus(vehicle: VehicleComplianceInput, referenceDate?: Date): ComplianceStatus {
  return worstComplianceStatus([
    getComplianceStatus(vehicle.registration_expiry, referenceDate),
    getComplianceStatus(vehicle.insurance_expiry, referenceDate),
  ]);
}
