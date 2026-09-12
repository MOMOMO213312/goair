import { supabase } from "./supabase";

export const PARTNER_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";
export const PARTNER_TEMP_ERROR = "حصل خطأ مؤقت. حاول مرة تانية.";

function unwrap<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return (data as T) ?? null;
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function throwPartnerRpcError(error: { message?: string; code?: string }): never {
  const message = error.message?.toLowerCase() ?? "";
  if (
    message.includes("invalid") ||
    message.includes("token") ||
    message.includes("access") ||
    message.includes("unauthorized") ||
    message.includes("permission") ||
    message.includes("not found") ||
    error.code === "PGRST301"
  ) {
    throw new Error(PARTNER_AUTH_ERROR);
  }
  throw new Error(PARTNER_TEMP_ERROR);
}

export function isPartnerAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === PARTNER_AUTH_ERROR;
}

export function formatPartnerMoney(amount: number) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function getPartnerReferralUrl(referralCode: string) {
  const base =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://goair.com";
  return `${base}/?ref=${encodeURIComponent(referralCode)}`;
}

export type PartnerDashboard = {
  partnerName: string;
  logoUrl: string | null;
  brandApproved: boolean;
  referralCode: string | null;
  commissionRate: number | null;
  currentMonthBookings: number;
  currentMonthCommissionDueUsd: number;
  lifetimeBookings: number;
  averageRating: number | null;
  ratingsCount: number;
  slaResponseMinutes: number | null;
  slaMaxCancellationRate: number | null;
  slaTerminationNoticeDays: number | null;
  slaNotes: string | null;
  /** "airline" or "agency" — the unified Partner Portal serves both. */
  partnerType: string;
};

export async function getPartnerDashboard(token: string): Promise<PartnerDashboard> {
  const { data, error } = await supabase.rpc("get_business_dashboard", { p_access_token: token });
  if (error) throwPartnerRpcError(error);
  const row = unwrap<Record<string, unknown>>(data);
  if (!row) throw new Error(PARTNER_AUTH_ERROR);
  return {
    partnerType: (row["partner_type"] as string | null) ?? "airline",
    partnerName: String(row["partner_name"] ?? row["name"] ?? "شريك GoAir"),
    logoUrl: (row["logo_url"] as string | null) ?? null,
    brandApproved: row["brand_approved"] === true,
    referralCode: (row["referral_code"] as string | null) ?? null,
    commissionRate: row["commission_rate"] == null ? null : num(row["commission_rate"]),
    currentMonthBookings: num(row["current_month_bookings"]),
    currentMonthCommissionDueUsd: num(row["current_month_commission_due_usd"]),
    lifetimeBookings: num(row["lifetime_bookings"]),
    averageRating: row["average_rating"] == null ? null : num(row["average_rating"]),
    ratingsCount: num(row["ratings_count"]),
    slaResponseMinutes: row["sla_response_minutes"] == null ? null : num(row["sla_response_minutes"]),
    slaMaxCancellationRate:
      row["sla_max_cancellation_rate"] == null ? null : num(row["sla_max_cancellation_rate"]),
    slaTerminationNoticeDays:
      row["sla_termination_notice_days"] == null ? null : num(row["sla_termination_notice_days"]),
    slaNotes: (row["sla_notes"] as string | null) ?? null,
  };
}

export type PartnerStatement = {
  id: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalBookings: number;
  totalTicketValueUsd: number;
  commissionDueUsd: number;
  status: string;
};

export async function getPartnerStatements(token: string): Promise<PartnerStatement[]> {
  const { data, error } = await supabase.rpc("get_business_statements", { p_access_token: token });
  if (error) throwPartnerRpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row, index) => ({
    id: String(row["id"] ?? `${row["period_start"]}-${index}`),
    periodStart: (row["period_start"] as string | null) ?? null,
    periodEnd: (row["period_end"] as string | null) ?? null,
    totalBookings: num(row["total_bookings"]),
    totalTicketValueUsd: num(row["total_ticket_value_usd"]),
    commissionDueUsd: num(row["commission_due_usd"]),
    status: String(row["status"] ?? "draft"),
  }));
}

export type PartnerBooking = {
  id: string;
  bookedAt: string | null;
  fullName: string;
  phoneNumber: string;
  travelDate: string | null;
  destination: string;
  origin: string;
  seatsCount: number;
  status: string;
  expectedTotalUsd: number;
  commissionUsd: number;
  paymentStatus: string;
  /** Operator-side execution status from trip_assignments (null until a driver is assigned). */
  lifecycleStatus: string | null;
  lifecycleUpdatedAt: string | null;
  driverName: string | null;
  /** Individual passenger names for group bookings (seatsCount > 1). Empty if not collected. */
  passengerNames: string[];
  /** 'to_airport' = العميل رايح المطار، 'from_airport' = العميل جاي من المطار. */
  direction: string | null;
  /** Shared id linking the outbound and return legs of a round-trip booking. Null for one-way. */
  roundTripGroupId: string | null;
};

export async function getPartnerBookings(
  token: string,
  from: string | null,
  to: string | null,
): Promise<PartnerBooking[]> {
  const { data, error } = await supabase.rpc("get_business_bookings", {
    p_access_token: token,
    p_from: from,
    p_to: to,
  });
  if (error) throwPartnerRpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row, index) => ({
    id: String(row["booking_id"] ?? index),
    bookedAt: (row["booked_at"] as string | null) ?? null,
    fullName: String(row["full_name"] ?? "—"),
    phoneNumber: String(row["phone_number"] ?? "—"),
    travelDate: (row["travel_date"] as string | null) ?? null,
    destination: String(row["destination"] ?? "—"),
    origin: String(row["origin"] ?? "—"),
    seatsCount: num(row["seats_count"]),
    status: String(row["status"] ?? "—"),
    expectedTotalUsd: num(row["expected_total_usd"]),
    commissionUsd: num(row["commission_usd"]),
    paymentStatus: String(row["payment_status"] ?? "لسه ما دفعش"),
    lifecycleStatus: (row["lifecycle_status"] as string | null) ?? null,
    lifecycleUpdatedAt: (row["lifecycle_updated_at"] as string | null) ?? null,
    driverName: (row["driver_name"] as string | null) ?? null,
    passengerNames: ((row["passenger_names"] as string[] | null) ?? []).filter(Boolean),
    direction: (row["direction"] as string | null) ?? null,
    roundTripGroupId: (row["round_trip_group_id"] as string | null) ?? null,
  }));
}

/**
 * Cancel one of this partner's own bookings. Ownership is enforced
 * server-side by `cancel_business_booking` (checks sales_partner_id against
 * the resolved token) — never call the underlying `cancel_booking_by_ticket`
 * RPC directly here, it has no ownership check.
 */
export async function cancelBusinessBooking(
  token: string,
  bookingId: string,
  reason: string | null,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("cancel_business_booking", {
    p_access_token: token,
    p_booking_id: bookingId,
    p_reason: reason,
  });
  if (error) throwPartnerRpcError(error);
  return Boolean(data);
}

export function partnerDirectionLabel(direction: string | null): string {
  if (direction === "to_airport") return "إلى المطار";
  if (direction === "from_airport") return "من المطار";
  return "—";
}

/** Builds and downloads a CSV of the passenger list — one row per passenger for group bookings
 * (seatsCount > 1 with names collected), one row for solo bookings. Includes round-trip linkage. */
export function exportPartnerBookingsCsv(bookings: PartnerBooking[], filenamePrefix = "goair-bookings") {
  const headers = [
    "تاريخ الحجز",
    "اسم الراكب",
    "تليفون التواصل",
    "تاريخ الرحلة",
    "الاتجاه",
    "الوجهة",
    "ذهاب وعودة؟",
    "عدد المقاعد بالحجز",
    "الحالة",
    "حالة الدفع",
    "إجمالي الحجز (USD)",
    "العمولة (USD)",
  ];

  function csvCell(value: string | number) {
    const s = String(value ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  const rows: string[][] = [];
  for (const b of bookings) {
    const names = b.passengerNames.length > 0 ? b.passengerNames : [b.fullName];
    const isRoundTrip = b.roundTripGroupId ? "نعم" : "لا";
    for (const name of names) {
      rows.push([
        formatDate(b.bookedAt),
        name,
        b.phoneNumber,
        formatDate(b.travelDate),
        partnerDirectionLabel(b.direction),
        `${b.origin} ← ${b.destination}`,
        isRoundTrip,
        String(b.seatsCount),
        partnerBookingStatusLabel(b.status),
        b.paymentStatus,
        b.expectedTotalUsd.toFixed(2),
        b.commissionUsd.toFixed(2),
      ]);
    }
  }

  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${todayIso()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type PartnerSubscription = {
  id: string;
  subscriptionCode: string;
  fullName: string;
  phoneNumber: string;
  planName: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  expectedTotalUsd: number;
  commissionUsd: number;
  createdAt: string | null;
};

/** Subscriptions (recurring plans) this partner sold — a revenue stream separate from trip bookings/commission. */
export async function getPartnerSubscriptions(
  token: string,
  from: string | null,
  to: string | null,
): Promise<PartnerSubscription[]> {
  const { data, error } = await supabase.rpc("get_business_subscriptions", {
    p_access_token: token,
    p_from: from,
    p_to: to,
  });
  if (error) throwPartnerRpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row, index) => ({
    id: String(row["subscription_id"] ?? index),
    subscriptionCode: String(row["subscription_code"] ?? "—"),
    fullName: String(row["full_name"] ?? "—"),
    phoneNumber: String(row["phone_number"] ?? "—"),
    planName: String(row["plan_name"] ?? "—"),
    status: String(row["status"] ?? "—"),
    startsAt: (row["starts_at"] as string | null) ?? null,
    endsAt: (row["ends_at"] as string | null) ?? null,
    expectedTotalUsd: num(row["expected_total_usd"]),
    commissionUsd: num(row["commission_usd"]),
    createdAt: (row["created_at"] as string | null) ?? null,
  }));
}

export function subscriptionStatusLabel(status: string) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    pending_payment: "بانتظار الدفع",
    active: "مفعّل",
    expired: "منتهي",
    cancelled: "ملغي",
    canceled: "ملغي",
  };
  return map[key] ?? status;
}

export async function submitCapacityForecast(params: {
  token: string;
  periodStart: string;
  periodEnd: string;
  expectedTrips: number;
  expectedPassengers: number;
}) {
  const { error } = await supabase.rpc("submit_capacity_forecast", {
    p_access_token: params.token,
    p_period_start: params.periodStart,
    p_period_end: params.periodEnd,
    p_expected_trips: params.expectedTrips,
    p_expected_passengers: params.expectedPassengers,
  });
  if (error) throwPartnerRpcError(error);
  return true;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function partnerBookingStatusLabel(status: string) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    canceled: "ملغي",
  };
  return map[key] ?? status;
}

/**
 * Operator-side execution lifecycle (`trip_assignments.operator_status`) —
 * separate from `booking.status`. This is what actually tells a partner
 * whether a driver was assigned and where the trip is right now, not just
 * whether the booking itself was accepted.
 */
const LIFECYCLE_STAGES = [
  "pending",
  "accepted",
  "on_the_way",
  "picked_up",
  "completed",
] as const;

const LIFECYCLE_LABELS: Record<string, string> = {
  pending: "بانتظار تعيين سائق",
  accepted: "تم تعيين السائق",
  on_the_way: "السائق في الطريق",
  picked_up: "تم استلام الراكب",
  completed: "اكتملت الرحلة",
  delayed: "تأخير",
  vehicle_issue: "مشكلة في المركبة",
  driver_change: "تم تغيير السائق",
  cancelled: "ملغاة",
  no_show: "الراكب لم يحضر",
  rejected: "تم رفض التعيين",
};

/** Human label for an operator_status value. Falls back to a generic "not yet dispatched" label when null (booking exists but no driver assigned yet). */
export function partnerLifecycleLabel(status: string | null) {
  if (!status) return "لسه ما اتجهزتش للتشغيل";
  return LIFECYCLE_LABELS[status.toLowerCase()] ?? status;
}

/** Whether this lifecycle status represents a problem that deserves a warning color, rather than normal progress. */
export function isPartnerLifecycleAlert(status: string | null) {
  if (!status) return false;
  return ["delayed", "vehicle_issue", "no_show", "rejected"].includes(status.toLowerCase());
}

/** 0-based progress index into the normal happy-path stages, or null for cancelled/alert statuses that don't fit a linear progress bar. */
export function partnerLifecycleProgress(status: string | null): number | null {
  if (!status) return 0;
  const key = status.toLowerCase();
  const index = LIFECYCLE_STAGES.indexOf(key as (typeof LIFECYCLE_STAGES)[number]);
  return index === -1 ? null : index;
}

export const PARTNER_LIFECYCLE_STAGE_COUNT = LIFECYCLE_STAGES.length;
