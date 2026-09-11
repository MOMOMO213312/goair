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

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

/** Service-request lifecycle, matches booking_addon_services_status_check */
export type GroundHandlingRequestStatus =
  | "requested"
  | "accepted"
  | "preparing"
  | "staff_assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Service-catalog approval workflow, matches ground_handling_services_status_check */
export type GroundHandlingServiceStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "paused"
  | "deletion_requested";

export type GroundHandlingServicePendingAction = "create" | "edit" | "pause" | "resume" | null;

export type GroundHandlingStatementStatus = "draft" | "sent" | "paid";

const REQUEST_STATUS_LABELS: Record<GroundHandlingRequestStatus, string> = {
  requested: "مطلوب",
  accepted: "مقبول",
  preparing: "قيد التجهيز",
  staff_assigned: "تم تعيين موظف",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const REQUEST_STATUS_ORDER: GroundHandlingRequestStatus[] = [
  "requested",
  "accepted",
  "preparing",
  "staff_assigned",
  "in_progress",
  "completed",
  "cancelled",
];

export function groundHandlingStatusLabel(status: string) {
  return REQUEST_STATUS_LABELS[status as GroundHandlingRequestStatus] ?? status;
}

const SERVICE_STATUS_LABELS: Record<GroundHandlingServiceStatus, string> = {
  pending_review: "قيد المراجعة",
  approved: "معتمدة",
  rejected: "مرفوضة",
  paused: "متوقفة مؤقتًا",
  deletion_requested: "طلب حذف قيد المراجعة",
};

export function groundHandlingServiceStatusLabel(status: string) {
  return SERVICE_STATUS_LABELS[status as GroundHandlingServiceStatus] ?? status;
}

const STATEMENT_STATUS_LABELS: Record<GroundHandlingStatementStatus, string> = {
  draft: "مسودة",
  sent: "مرسلة",
  paid: "مدفوعة",
};

export function groundHandlingStatementStatusLabel(status: string) {
  return STATEMENT_STATUS_LABELS[status as GroundHandlingStatementStatus] ?? status;
}

export function formatGroundHandlingDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatGroundHandlingDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// 1. Dashboard
// ---------------------------------------------------------------------------

export type GroundHandlingDashboard = {
  name: string;
  airportCode: string;
  country: string | null;
  isActive: boolean;
  newCount: number;
  preparingCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  totalCount: number;
  urgentCount: number;
  todayFlightsCount: number;
};

export async function getGroundHandlingDashboard(token: string): Promise<GroundHandlingDashboard> {
  const { data, error } = await supabase.rpc("get_ground_handling_dashboard", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error(GROUND_HANDLING_AUTH_ERROR);
  return {
    name: String(row["name"] ?? "شريك خدمات أرضية"),
    airportCode: String(row["airport_code"] ?? ""),
    country: (row["country"] as string | null) ?? null,
    isActive: row["is_active"] !== false,
    newCount: Number(row["new_count"] ?? 0),
    preparingCount: Number(row["preparing_count"] ?? 0),
    inProgressCount: Number(row["in_progress_count"] ?? 0),
    completedTodayCount: Number(row["completed_today_count"] ?? 0),
    totalCount: Number(row["total_count"] ?? 0),
    urgentCount: Number(row["urgent_count"] ?? 0),
    todayFlightsCount: Number(row["today_flights_count"] ?? 0),
  };
}

// ---------------------------------------------------------------------------
// 2. Service requests
// ---------------------------------------------------------------------------

export type GroundHandlingRequest = {
  requestId: string;
  bookingId: string;
  ticketCode: string | null;
  serviceName: string;
  priceUsd: number;
  status: GroundHandlingRequestStatus;
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
  terminal: string | null;
  direction: "arrival" | "departure" | null;
  isUrgent: boolean;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
};

function mapRequest(row: Record<string, unknown>): GroundHandlingRequest {
  return {
    requestId: String(row["request_id"]),
    bookingId: String(row["booking_id"]),
    ticketCode: (row["ticket_code"] as string | null) ?? null,
    serviceName: String(row["service_name"] ?? ""),
    priceUsd: Number(row["price_usd"] ?? 0),
    status: (row["status"] as GroundHandlingRequestStatus) ?? "requested",
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
    terminal: (row["terminal"] as string | null) ?? null,
    direction: (row["direction"] as "arrival" | "departure" | null) ?? null,
    isUrgent: Boolean(row["is_urgent"]),
    assignedStaffId: (row["assigned_staff_id"] as string | null) ?? null,
    assignedStaffName: (row["assigned_staff_name"] as string | null) ?? null,
  };
}

export async function getGroundHandlingRequests(
  token: string,
  status?: GroundHandlingRequestStatus | null,
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
  status: GroundHandlingRequestStatus,
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

export async function assignGroundHandlingStaff(
  token: string,
  requestId: string,
  staffId: string,
): Promise<void> {
  const { error } = await supabase.rpc("assign_ground_handling_staff", {
    p_access_token: token,
    p_request_id: requestId,
    p_staff_id: staffId,
  });
  if (error) rpcError(error);
}

// ---------------------------------------------------------------------------
// 3. Flights
// ---------------------------------------------------------------------------

export type GroundHandlingFlight = {
  bookingId: string;
  flightNumber: string | null;
  travelDate: string | null;
  travelDatetime: string | null;
  origin: string;
  destination: string;
  airportName: string | null;
  passengerCount: number;
  servicesCount: number;
  urgentCount: number;
  statuses: string[];
};

function mapFlight(row: Record<string, unknown>): GroundHandlingFlight {
  return {
    bookingId: String(row["booking_id"]),
    flightNumber: (row["flight_number"] as string | null) ?? null,
    travelDate: (row["travel_date"] as string | null) ?? null,
    travelDatetime: (row["travel_datetime"] as string | null) ?? null,
    origin: String(row["origin"] ?? "—"),
    destination: String(row["destination"] ?? "—"),
    airportName: (row["airport_name"] as string | null) ?? null,
    passengerCount: Number(row["passenger_count"] ?? 0),
    servicesCount: Number(row["services_count"] ?? 0),
    urgentCount: Number(row["urgent_count"] ?? 0),
    statuses: (row["statuses"] as string[] | null) ?? [],
  };
}

export async function getGroundHandlingFlights(token: string): Promise<GroundHandlingFlight[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_flights", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapFlight);
}

export type GroundHandlingFlightDetailRow = {
  requestId: string;
  serviceName: string;
  priceUsd: number;
  status: GroundHandlingRequestStatus;
  partnerNotes: string | null;
  passengerName: string;
  phoneNumber: string;
  terminal: string | null;
  direction: "arrival" | "departure" | null;
  isUrgent: boolean;
  assignedStaffName: string | null;
};

export async function getGroundHandlingFlightDetail(
  token: string,
  bookingId: string,
): Promise<GroundHandlingFlightDetailRow[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_flight_detail", {
    p_access_token: token,
    p_booking_id: bookingId,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    requestId: String(row["request_id"]),
    serviceName: String(row["service_name"] ?? ""),
    priceUsd: Number(row["price_usd"] ?? 0),
    status: (row["status"] as GroundHandlingRequestStatus) ?? "requested",
    partnerNotes: (row["partner_notes"] as string | null) ?? null,
    passengerName: String(row["passenger_name"] ?? ""),
    phoneNumber: String(row["phone_number"] ?? ""),
    terminal: (row["terminal"] as string | null) ?? null,
    direction: (row["direction"] as "arrival" | "departure" | null) ?? null,
    isUrgent: Boolean(row["is_urgent"]),
    assignedStaffName: (row["assigned_staff_name"] as string | null) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// 4. Travelers
// ---------------------------------------------------------------------------

export type GroundHandlingTraveler = {
  bookingId: string;
  passengerName: string;
  phoneNumber: string;
  flightNumber: string | null;
  travelDate: string | null;
  requestsCount: number;
  completedCount: number;
  totalSpentUsd: number;
};

export async function getGroundHandlingTravelers(token: string): Promise<GroundHandlingTraveler[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_travelers", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    bookingId: String(row["booking_id"]),
    passengerName: String(row["passenger_name"] ?? ""),
    phoneNumber: String(row["phone_number"] ?? ""),
    flightNumber: (row["flight_number"] as string | null) ?? null,
    travelDate: (row["travel_date"] as string | null) ?? null,
    requestsCount: Number(row["requests_count"] ?? 0),
    completedCount: Number(row["completed_count"] ?? 0),
    totalSpentUsd: Number(row["total_spent_usd"] ?? 0),
  }));
}

export type GroundHandlingTravelerHistoryRow = {
  requestId: string;
  serviceName: string;
  priceUsd: number;
  status: GroundHandlingRequestStatus;
  travelDate: string | null;
  createdAt: string | null;
};

export async function getGroundHandlingTravelerHistory(
  token: string,
  bookingId: string,
): Promise<GroundHandlingTravelerHistoryRow[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_traveler_history", {
    p_access_token: token,
    p_booking_id: bookingId,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    requestId: String(row["request_id"]),
    serviceName: String(row["service_name"] ?? ""),
    priceUsd: Number(row["price_usd"] ?? 0),
    status: (row["status"] as GroundHandlingRequestStatus) ?? "requested",
    travelDate: (row["travel_date"] as string | null) ?? null,
    createdAt: (row["created_at"] as string | null) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// 5. Service catalog (partner side)
// ---------------------------------------------------------------------------

export type GroundHandlingService = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  airportCode: string;
  terminal: string | null;
  direction: "arrival" | "departure" | null;
  operatingHoursStart: string | null;
  operatingHoursEnd: string | null;
  dailyCapacity: number | null;
  priceUsd: number;
  status: GroundHandlingServiceStatus;
  pendingAction: GroundHandlingServicePendingAction;
  adminNotes: string | null;
  createdAt: string | null;
};

function mapService(row: Record<string, unknown>): GroundHandlingService {
  return {
    id: String(row["id"]),
    name: String(row["name"] ?? ""),
    description: (row["description"] as string | null) ?? null,
    requirements: (row["requirements"] as string | null) ?? null,
    airportCode: String(row["airport_code"] ?? ""),
    terminal: (row["terminal"] as string | null) ?? null,
    direction: (row["direction"] as "arrival" | "departure" | null) ?? null,
    operatingHoursStart: (row["operating_hours_start"] as string | null) ?? null,
    operatingHoursEnd: (row["operating_hours_end"] as string | null) ?? null,
    dailyCapacity: row["daily_capacity"] == null ? null : Number(row["daily_capacity"]),
    priceUsd: Number(row["price_usd"] ?? 0),
    status: (row["status"] as GroundHandlingServiceStatus) ?? "pending_review",
    pendingAction: (row["pending_action"] as GroundHandlingServicePendingAction) ?? null,
    adminNotes: (row["admin_notes"] as string | null) ?? null,
    createdAt: (row["created_at"] as string | null) ?? null,
  };
}

export async function listGroundHandlingServices(token: string): Promise<GroundHandlingService[]> {
  const { data, error } = await supabase.rpc("list_ground_handling_services", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapService);
}

export type GroundHandlingServiceInput = {
  name: string;
  description: string | null;
  requirements: string | null;
  airportCode: string;
  terminal: string | null;
  direction: "arrival" | "departure" | null;
  operatingHoursStart: string | null; // "HH:MM"
  operatingHoursEnd: string | null;
  dailyCapacity: number | null;
  priceUsd: number;
};

export async function createGroundHandlingService(
  token: string,
  input: GroundHandlingServiceInput,
): Promise<GroundHandlingService> {
  const { data, error } = await supabase.rpc("create_ground_handling_service", {
    p_access_token: token,
    p_name: input.name,
    p_description: input.description,
    p_requirements: input.requirements,
    p_airport_code: input.airportCode,
    p_terminal: input.terminal,
    p_direction: input.direction,
    p_operating_hours_start: input.operatingHoursStart,
    p_operating_hours_end: input.operatingHoursEnd,
    p_daily_capacity: input.dailyCapacity,
    p_price_usd: input.priceUsd,
  });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  return mapService(row);
}

export async function updateGroundHandlingService(
  token: string,
  serviceId: string,
  input: GroundHandlingServiceInput,
): Promise<void> {
  const { error } = await supabase.rpc("update_ground_handling_service", {
    p_access_token: token,
    p_service_id: serviceId,
    p_name: input.name,
    p_description: input.description,
    p_requirements: input.requirements,
    p_airport_code: input.airportCode,
    p_terminal: input.terminal,
    p_direction: input.direction,
    p_operating_hours_start: input.operatingHoursStart,
    p_operating_hours_end: input.operatingHoursEnd,
    p_daily_capacity: input.dailyCapacity,
    p_price_usd: input.priceUsd,
  });
  if (error) rpcError(error);
}

export async function setGroundHandlingServicePause(
  token: string,
  serviceId: string,
  paused: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_ground_handling_service_pause", {
    p_access_token: token,
    p_service_id: serviceId,
    p_paused: paused,
  });
  if (error) rpcError(error);
}

export async function requestGroundHandlingServiceDeletion(
  token: string,
  serviceId: string,
): Promise<void> {
  const { error } = await supabase.rpc("request_ground_handling_service_deletion", {
    p_access_token: token,
    p_service_id: serviceId,
  });
  if (error) rpcError(error);
}

// ---------------------------------------------------------------------------
// 6. Staff
// ---------------------------------------------------------------------------

export type GroundHandlingStaff = {
  id: string;
  fullName: string;
  role: string | null;
  phone: string | null;
  isActive: boolean;
  permissions: string[];
  assignedOpenCount: number;
  createdAt: string | null;
};

function mapStaff(row: Record<string, unknown>): GroundHandlingStaff {
  return {
    id: String(row["id"]),
    fullName: String(row["full_name"] ?? ""),
    role: (row["role"] as string | null) ?? null,
    phone: (row["phone"] as string | null) ?? null,
    isActive: row["is_active"] !== false,
    permissions: (row["permissions"] as string[] | null) ?? [],
    assignedOpenCount: Number(row["assigned_open_count"] ?? 0),
    createdAt: (row["created_at"] as string | null) ?? null,
  };
}

export async function listGroundHandlingStaff(token: string): Promise<GroundHandlingStaff[]> {
  const { data, error } = await supabase.rpc("list_ground_handling_staff", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapStaff);
}

export async function createGroundHandlingStaff(
  token: string,
  input: { fullName: string; role: string | null; phone: string | null; permissions: string[] },
): Promise<GroundHandlingStaff> {
  const { data, error } = await supabase.rpc("create_ground_handling_staff", {
    p_access_token: token,
    p_full_name: input.fullName,
    p_role: input.role,
    p_phone: input.phone,
    p_permissions: input.permissions,
  });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  return mapStaff(row);
}

export async function updateGroundHandlingStaff(
  token: string,
  staffId: string,
  input: { fullName: string; role: string | null; phone: string | null; isActive: boolean; permissions: string[] },
): Promise<void> {
  const { error } = await supabase.rpc("update_ground_handling_staff", {
    p_access_token: token,
    p_staff_id: staffId,
    p_full_name: input.fullName,
    p_role: input.role,
    p_phone: input.phone,
    p_is_active: input.isActive,
    p_permissions: input.permissions,
  });
  if (error) rpcError(error);
}

export async function deleteGroundHandlingStaff(token: string, staffId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_ground_handling_staff", {
    p_access_token: token,
    p_staff_id: staffId,
  });
  if (error) rpcError(error);
}

// ---------------------------------------------------------------------------
// 7. Reports
// ---------------------------------------------------------------------------

export type GroundHandlingReports = {
  completedCount: number;
  cancelledCount: number;
  byAirport: { airportCode: string; count: number }[];
  byService: { serviceName: string; count: number }[];
  byPeriod: { date: string; count: number }[];
  staffPerformance: { staffName: string; completedCount: number }[];
};

export async function getGroundHandlingReports(
  token: string,
  from: string,
  to: string,
): Promise<GroundHandlingReports> {
  const { data, error } = await supabase.rpc("get_ground_handling_reports", {
    p_access_token: token,
    p_from: from,
    p_to: to,
  });
  if (error) rpcError(error);
  const j = (data ?? {}) as Record<string, unknown>;
  return {
    completedCount: Number(j["completed_count"] ?? 0),
    cancelledCount: Number(j["cancelled_count"] ?? 0),
    byAirport: ((j["by_airport"] as Record<string, unknown>[] | null) ?? []).map((r) => ({
      airportCode: String(r["airport_code"] ?? ""),
      count: Number(r["count"] ?? 0),
    })),
    byService: ((j["by_service"] as Record<string, unknown>[] | null) ?? []).map((r) => ({
      serviceName: String(r["service_name"] ?? ""),
      count: Number(r["count"] ?? 0),
    })),
    byPeriod: ((j["by_period"] as Record<string, unknown>[] | null) ?? []).map((r) => ({
      date: String(r["date"] ?? ""),
      count: Number(r["count"] ?? 0),
    })),
    staffPerformance: ((j["staff_performance"] as Record<string, unknown>[] | null) ?? []).map((r) => ({
      staffName: String(r["staff_name"] ?? ""),
      completedCount: Number(r["completed_count"] ?? 0),
    })),
  };
}

// ---------------------------------------------------------------------------
// 8. Settlements (statements)
// ---------------------------------------------------------------------------

export type GroundHandlingStatement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalCompleted: number;
  totalDueUsd: number;
  paidUsd: number;
  remainingUsd: number;
  status: GroundHandlingStatementStatus;
  generatedAt: string | null;
};

export async function getGroundHandlingStatements(token: string): Promise<GroundHandlingStatement[]> {
  const { data, error } = await supabase.rpc("get_ground_handling_statements", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row["id"]),
    periodStart: String(row["period_start"]),
    periodEnd: String(row["period_end"]),
    totalCompleted: Number(row["total_completed"] ?? 0),
    totalDueUsd: Number(row["total_due_usd"] ?? 0),
    paidUsd: Number(row["paid_usd"] ?? 0),
    remainingUsd: Number(row["remaining_usd"] ?? 0),
    status: (row["status"] as GroundHandlingStatementStatus) ?? "draft",
    generatedAt: (row["generated_at"] as string | null) ?? null,
  }));
}

export async function getGroundHandlingUnsettledSummary(
  token: string,
): Promise<{ unsettledCount: number; unsettledTotalUsd: number }> {
  const { data, error } = await supabase.rpc("get_ground_handling_unsettled_summary", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  return {
    unsettledCount: Number(row?.["unsettled_count"] ?? 0),
    unsettledTotalUsd: Number(row?.["unsettled_total_usd"] ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Admin-side functions (used from admin.ground-handling.tsx)
// ---------------------------------------------------------------------------

export type GroundHandlingPartner = {
  id: string;
  name: string;
  airportCode: string;
  country: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
};

function mapPartner(row: Record<string, unknown>): GroundHandlingPartner {
  return {
    id: String(row["id"]),
    name: String(row["name"] ?? ""),
    airportCode: String(row["airport_code"] ?? ""),
    country: (row["country"] as string | null) ?? null,
    contactEmail: (row["contact_email"] as string | null) ?? null,
    contactPhone: (row["contact_phone"] as string | null) ?? null,
    isActive: row["is_active"] !== false,
  };
}

export async function adminListGroundHandlingPartners(token: string): Promise<GroundHandlingPartner[]> {
  const { data, error } = await supabase.rpc("admin_list_ground_handling_partners", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapPartner);
}

export async function adminCreateGroundHandlingPartner(
  token: string,
  input: { name: string; airportCode: string; country: string | null; contactEmail: string | null; contactPhone: string | null },
): Promise<GroundHandlingPartner> {
  const { data, error } = await supabase.rpc("admin_create_ground_handling_partner", {
    p_access_token: token,
    p_name: input.name,
    p_airport_code: input.airportCode,
    p_country: input.country,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone,
  });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  return mapPartner(row);
}

export async function adminUpdateGroundHandlingPartner(
  token: string,
  id: string,
  input: { name: string; airportCode: string; country: string | null; contactEmail: string | null; contactPhone: string | null; isActive: boolean },
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_ground_handling_partner", {
    p_access_token: token,
    p_id: id,
    p_name: input.name,
    p_airport_code: input.airportCode,
    p_country: input.country,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone,
    p_is_active: input.isActive,
  });
  if (error) rpcError(error);
}

export async function adminDeleteGroundHandlingPartner(token: string, id: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_ground_handling_partner", { p_access_token: token, p_id: id });
  if (error) rpcError(error);
}

export async function adminListGroundHandlingRequests(
  token: string,
  status?: GroundHandlingRequestStatus | null,
): Promise<(GroundHandlingRequest & { partnerId: string; partnerName: string })[]> {
  const { data, error } = await supabase.rpc("admin_list_ground_handling_requests", {
    p_access_token: token,
    p_status: status ?? null,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...mapRequest(row),
    partnerId: String(row["partner_id"]),
    partnerName: String(row["partner_name"] ?? ""),
  }));
}

export async function adminListGroundHandlingServices(
  token: string,
  partnerId?: string | null,
  status?: GroundHandlingServiceStatus | null,
): Promise<(GroundHandlingService & { partnerId: string; partnerName: string; previousStatus: string | null })[]> {
  const { data, error } = await supabase.rpc("admin_list_ground_handling_services", {
    p_access_token: token,
    p_partner_id: partnerId ?? null,
    p_status: status ?? null,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...mapService(row),
    partnerId: String(row["partner_id"]),
    partnerName: String(row["partner_name"] ?? ""),
    previousStatus: (row["previous_status"] as string | null) ?? null,
  }));
}

/** decision: "approve" | "reject" */
export async function adminReviewGroundHandlingService(
  token: string,
  serviceId: string,
  decision: "approve" | "reject",
  notes?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_review_ground_handling_service", {
    p_access_token: token,
    p_service_id: serviceId,
    p_decision: decision,
    p_notes: notes ?? null,
  });
  if (error) rpcError(error);
}

export async function adminListGroundHandlingStatements(
  token: string,
  partnerId?: string | null,
): Promise<(GroundHandlingStatement & { partnerId: string; partnerName: string })[]> {
  const { data, error } = await supabase.rpc("admin_list_ground_handling_statements", {
    p_access_token: token,
    p_partner_id: partnerId ?? null,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    partnerName: String(row["partner_name"] ?? ""),
    periodStart: String(row["period_start"]),
    periodEnd: String(row["period_end"]),
    totalCompleted: Number(row["total_completed"] ?? 0),
    totalDueUsd: Number(row["total_due_usd"] ?? 0),
    paidUsd: Number(row["paid_usd"] ?? 0),
    remainingUsd: Number(row["total_due_usd"] ?? 0) - Number(row["paid_usd"] ?? 0),
    status: (row["status"] as GroundHandlingStatementStatus) ?? "draft",
    generatedAt: (row["generated_at"] as string | null) ?? null,
  }));
}

export async function adminGenerateGroundHandlingStatement(
  token: string,
  partnerId: string,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_generate_ground_handling_statement", {
    p_access_token: token,
    p_partner_id: partnerId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error) rpcError(error);
}

export async function adminUpdateGroundHandlingStatement(
  token: string,
  statementId: string,
  status: GroundHandlingStatementStatus,
  paidUsd: number,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_ground_handling_statement", {
    p_access_token: token,
    p_statement_id: statementId,
    p_status: status,
    p_paid_usd: paidUsd,
  });
  if (error) rpcError(error);
}
