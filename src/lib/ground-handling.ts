import { supabase } from "./supabase";

export const GROUND_HANDLING_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";
const GROUND_HANDLING_STORAGE_KEY = "goair_ground_handling_token";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, the database resolves the ground handling partner
// from auth.uid() instead, so we just send this placeholder.
export const GROUND_HANDLING_RPC_TOKEN = "session-auth";

export function isGroundHandlingAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === GROUND_HANDLING_AUTH_ERROR;
}

function rpcError(error: { message?: string }): never {
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("رمز الدخول") || message.includes("token")) {
    throw new Error(GROUND_HANDLING_AUTH_ERROR);
  }
  throw new Error(error.message || "حصل خطأ مؤقت. حاول تاني.");
}

export function getStoredGroundHandlingToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GROUND_HANDLING_STORAGE_KEY);
}

export function storeGroundHandlingToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GROUND_HANDLING_STORAGE_KEY, token);
}

export function clearGroundHandlingToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GROUND_HANDLING_STORAGE_KEY);
}

export type GroundHandlingDashboard = {
  name: string;
  airportCode: string;
  country: string | null;
  isActive: boolean;
  pendingCount: number;
  inProgressCount: number;
  doneTodayCount: number;
};

export async function getGroundHandlingDashboard(token: string): Promise<GroundHandlingDashboard> {
  const { data, error } = await supabase.rpc("get_ground_handling_dashboard", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error(GROUND_HANDLING_AUTH_ERROR);
  return {
    name: String(row["name"] ?? "شريك تشغيل أرضي"),
    airportCode: String(row["airport_code"] ?? ""),
    country: (row["country"] as string | null) ?? null,
    isActive: row["is_active"] !== false,
    pendingCount: Number(row["pending_count"] ?? 0),
    inProgressCount: Number(row["in_progress_count"] ?? 0),
    doneTodayCount: Number(row["done_today_count"] ?? 0),
  };
}

export type GroundHandlingRequest = {
  requestId: string;
  bookingId: string;
  ticketCode: string | null;
  serviceName: string;
  priceUsd: number;
  status: string;
  partnerNotes: string | null;
  travelDate: string | null;
  travelDatetime: string | null;
  passengerName: string;
  phoneNumber: string;
  flightNumber: string | null;
  seatsCount: number;
  origin: string;
  destination: string;
  airportName: string | null;
  bookingStatus: string | null;
  bookedAt: string | null;
};

function mapRequest(row: Record<string, unknown>): GroundHandlingRequest {
  return {
    requestId: String(row["request_id"]),
    bookingId: String(row["booking_id"]),
    ticketCode: (row["ticket_code"] as string | null) ?? null,
    serviceName: String(row["service_name"] ?? ""),
    priceUsd: Number(row["price_usd"] ?? 0),
    status: String(row["status"] ?? "pending"),
    partnerNotes: (row["partner_notes"] as string | null) ?? null,
    travelDate: (row["travel_date"] as string | null) ?? null,
    travelDatetime: (row["travel_datetime"] as string | null) ?? null,
    passengerName: String(row["passenger_name"] ?? ""),
    phoneNumber: String(row["phone_number"] ?? ""),
    flightNumber: (row["flight_number"] as string | null) ?? null,
    seatsCount: Number(row["seats_count"] ?? 0),
    origin: String(row["origin"] ?? "—"),
    destination: String(row["destination"] ?? "—"),
    airportName: (row["airport_name"] as string | null) ?? null,
    bookingStatus: (row["booking_status"] as string | null) ?? null,
    bookedAt: (row["booked_at"] as string | null) ?? null,
  };
}

export async function getGroundHandlingRequests(
  token: string,
  status?: string | null,
): Promise<GroundHandlingRequest[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_requests", {
    p_access_token: token,
    p_status: status ?? null,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRequest);
}

export async function updateGroundHandlingRequestStatus(
  token: string,
  requestId: string,
  status: "pending" | "in_progress" | "done" | "cancelled",
  notes?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("update_ground_handling_request_status", {
    p_access_token: token,
    p_request_id: requestId,
    p_status: status,
    p_notes: notes ?? null,
  });
  if (error) rpcError(error);
}

export function groundHandlingStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "مطلوبة",
    in_progress: "جاري التجهيز",
    done: "تمت",
    cancelled: "ملغاة",
  };
  return map[status] ?? status;
}

export function formatGroundHandlingDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}
