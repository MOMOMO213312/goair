import { supabase } from "./supabase";

export const AGENCY_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";
export const AGENCY_TEMP_ERROR = "حصل خطأ مؤقت. حاول مرة تانية.";

function unwrap<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return (data as T) ?? null;
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function throwAgencyRpcError(error: { message?: string; code?: string }): never {
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
    throw new Error(AGENCY_AUTH_ERROR);
  }
  throw new Error(AGENCY_TEMP_ERROR);
}

export function isAgencyAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === AGENCY_AUTH_ERROR;
}

export function formatAgencyMoney(amount: number) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function getAgencyReferralUrl(referralCode: string) {
  const base =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://goair.com";
  return `${base}/?ref=${encodeURIComponent(referralCode)}`;
}

export type AgencyDashboard = {
  agencyName: string;
  logoUrl: string | null;
  brandApproved: boolean;
  referralCode: string | null;
  commissionRate: number | null;
  currentMonthBookings: number;
  currentMonthTicketValueUsd: number;
  currentMonthCommissionDueUsd: number;
  lifetimeBookings: number;
  lifetimeCommissionDueUsd: number;
  averageRating: number | null;
  ratingsCount: number;
  slaResponseMinutes: number | null;
  slaMaxCancellationRate: number | null;
  slaTerminationNoticeDays: number | null;
  slaNotes: string | null;
};

export async function getAgencyDashboard(token: string): Promise<AgencyDashboard> {
  const { data, error } = await supabase.rpc("get_agency_dashboard", { p_access_token: token });
  if (error) throwAgencyRpcError(error);
  const row = unwrap<Record<string, unknown>>(data);
  if (!row) throw new Error(AGENCY_AUTH_ERROR);
  return {
    agencyName: String(row["name"] ?? "وكالة شريكة"),
    logoUrl: (row["logo_url"] as string | null) ?? null,
    brandApproved: row["brand_approved"] === true,
    referralCode: (row["referral_code"] as string | null) ?? null,
    commissionRate: row["commission_rate"] == null ? null : num(row["commission_rate"]),
    currentMonthBookings: num(row["current_month_bookings"]),
    currentMonthTicketValueUsd: num(row["current_month_ticket_value_usd"]),
    currentMonthCommissionDueUsd: num(row["current_month_commission_due_usd"]),
    lifetimeBookings: num(row["lifetime_bookings"]),
    lifetimeCommissionDueUsd: num(row["lifetime_commission_due_usd"]),
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

export type AgencyStatement = {
  id: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalBookings: number;
  totalTicketValueUsd: number;
  commissionDueUsd: number;
  status: string;
};

export async function getAgencyStatements(token: string): Promise<AgencyStatement[]> {
  const { data, error } = await supabase.rpc("get_agency_statements", { p_access_token: token });
  if (error) throwAgencyRpcError(error);
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

export type AgencyBooking = {
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
};

export async function getAgencyBookings(
  token: string,
  from: string | null,
  to: string | null,
): Promise<AgencyBooking[]> {
  const { data, error } = await supabase.rpc("get_agency_bookings", {
    p_access_token: token,
    p_from: from,
    p_to: to,
  });
  if (error) throwAgencyRpcError(error);
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
  }));
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

export function agencyBookingStatusLabel(status: string) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    canceled: "ملغي",
  };
  return map[key] ?? status;
}
