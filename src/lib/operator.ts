import { supabase } from "./supabase";

export const OPERATOR_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";
export function isOperatorAuthError(error: unknown) {
  return error instanceof Error && error.message === OPERATOR_AUTH_ERROR;
}
function rpcError(error: { message?: string }): never {
  throw new Error(error.message?.includes("رمز الدخول") ? OPERATOR_AUTH_ERROR : (error.message || "حصل خطأ."));
}

export const PAYOUT_MODEL_LABELS: Record<string, string> = {
  fixed_per_trip: "سعر ثابت لكل رحلة",
  percentage_of_ticket: "نسبة من قيمة التذاكر",
  per_seat: "سعر ثابت لكل مقعد",
};

export type OperatorDashboard = {
  operatorId: string;
  name: string;
  payoutModel: string;
  fixedAmountUsd: number | null;
  percentageRate: number | null;
  perSeatAmountUsd: number | null;
  vehiclesCount: number;
  driversCount: number;
  currentMonthTrips: number;
  currentMonthAmountDueUsd: number;
  lifetimeTrips: number;
  lifetimeAmountDueUsd: number;
};

function num(v: unknown) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }

export async function getOperatorDashboard(token: string): Promise<OperatorDashboard> {
  const { data, error } = await supabase.rpc("get_operator_dashboard", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error(OPERATOR_AUTH_ERROR);
  return {
    operatorId: String(row["operator_id"]),
    name: String(row["name"] ?? "شركة نقل"),
    payoutModel: String(row["payout_model"] ?? "fixed_per_trip"),
    fixedAmountUsd: row["fixed_amount_usd"] == null ? null : num(row["fixed_amount_usd"]),
    percentageRate: row["percentage_rate"] == null ? null : num(row["percentage_rate"]),
    perSeatAmountUsd: row["per_seat_amount_usd"] == null ? null : num(row["per_seat_amount_usd"]),
    vehiclesCount: num(row["vehicles_count"]),
    driversCount: num(row["drivers_count"]),
    currentMonthTrips: num(row["current_month_trips"]),
    currentMonthAmountDueUsd: num(row["current_month_amount_due_usd"]),
    lifetimeTrips: num(row["lifetime_trips"]),
    lifetimeAmountDueUsd: num(row["lifetime_amount_due_usd"]),
  };
}

export type OperatorTripStatus =
  | "pending" | "accepted" | "rejected"
  | "on_the_way" | "picked_up" | "completed"
  | "delayed" | "vehicle_issue" | "driver_change" | "cancelled" | "no_show"
  | string;

export type OperatorTrip = {
  assignmentId: string; travelDate: string; departureTime: string | null;
  destination: string; origin: string; seatsCount: number; amountDueUsd: number;
  driverName: string | null; vehiclePlate: string; operatorStatus: OperatorTripStatus;
  statusNote: string | null; statusUpdatedAt: string | null;
};

export async function getOperatorTrips(token: string): Promise<OperatorTrip[]> {
  const { data, error } = await supabase.rpc("get_operator_trips", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    assignmentId: String(r["assignment_id"]),
    travelDate: String(r["travel_date"] ?? ""),
    departureTime: (r["departure_time"] as string | null) ?? null,
    destination: String(r["destination"] ?? "—"),
    origin: String(r["origin"] ?? "—"),
    seatsCount: num(r["seats_count"]),
    amountDueUsd: num(r["amount_due_usd"]),
    driverName: (r["driver_name"] as string | null) ?? null,
    vehiclePlate: String(r["vehicle_plate"] ?? "—"),
    operatorStatus: String(r["operator_status"] ?? "pending"),
    statusNote: (r["status_note"] as string | null) ?? null,
    statusUpdatedAt: (r["status_updated_at"] as string | null) ?? null,
  }));
}

export const OPERATOR_TRIP_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار ردك",
  accepted: "موافَق عليها",
  rejected: "مرفوضة",
  on_the_way: "في الطريق",
  picked_up: "تم استلام الراكب",
  completed: "مكتملة",
  delayed: "متأخرة",
  vehicle_issue: "عطل في العربية",
  driver_change: "تغيير سائق",
  cancelled: "ملغاة",
  no_show: "الراكب لم يحضر",
};

/** Statuses that don't allow any further transition. */
export const OPERATOR_TERMINAL_STATUSES = new Set(["completed", "rejected", "cancelled", "no_show"]);

/** Mirrors the server-side transition guard in operator_set_trip_status — kept
 * in sync so the UI only ever offers moves the RPC will actually accept. */
export const OPERATOR_STATUS_TRANSITIONS: Record<string, OperatorTripStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["on_the_way", "delayed", "vehicle_issue", "driver_change", "cancelled", "no_show"],
  on_the_way: ["picked_up", "delayed", "vehicle_issue", "driver_change", "cancelled", "no_show"],
  picked_up: ["completed", "delayed"],
  delayed: ["on_the_way", "picked_up", "completed", "cancelled"],
  vehicle_issue: ["on_the_way", "driver_change", "cancelled"],
  driver_change: ["on_the_way", "picked_up"],
};

/** Statuses that require the operator to attach a reason/note. */
export const OPERATOR_STATUSES_REQUIRING_NOTE = new Set([
  "delayed", "vehicle_issue", "driver_change", "cancelled", "no_show",
]);

export async function operatorSetTripStatus(
  token: string,
  assignmentId: string,
  status: OperatorTripStatus,
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc("operator_set_trip_status", {
    p_access_token: token,
    p_assignment_id: assignmentId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) rpcError(error);
}

export type OperatorStatement = {
  id: string; periodStart: string; periodEnd: string;
  totalTrips: number; totalSeats: number; amountDueUsd: number; status: string;
};

export async function getOperatorStatements(token: string): Promise<OperatorStatement[]> {
  const { data, error } = await supabase.rpc("get_operator_statements", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r["id"]),
    periodStart: String(r["period_start"] ?? ""),
    periodEnd: String(r["period_end"] ?? ""),
    totalTrips: num(r["total_trips"]),
    totalSeats: num(r["total_seats"]),
    amountDueUsd: num(r["amount_due_usd"]),
    status: String(r["status"] ?? "draft"),
  }));
}

export type OperatorDriver = { id: string; full_name: string; phone_number: string };
export type OperatorVehicle = { id: string; plate_number: string; country: string; vehicle_label: string; capacity: number };

export async function getOperatorFleet(token: string): Promise<{ drivers: OperatorDriver[]; vehicles: OperatorVehicle[] }> {
  const { data, error } = await supabase.rpc("get_operator_fleet", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  return {
    drivers: (row?.["drivers"] as OperatorDriver[]) ?? [],
    vehicles: (row?.["vehicles"] as OperatorVehicle[]) ?? [],
  };
}

export async function operatorAddDriver(token: string, fullName: string, phone: string) {
  const { error } = await supabase.rpc("operator_add_driver", { p_access_token: token, p_full_name: fullName, p_phone_number: phone });
  if (error) rpcError(error);
}

export async function operatorAddVehicle(token: string, vehicleTypeId: string, plate: string, country: string, driverId: string | null) {
  const { error } = await supabase.rpc("operator_add_vehicle", {
    p_access_token: token, p_vehicle_type_id: vehicleTypeId, p_plate_number: plate, p_country: country, p_driver_id: driverId,
  });
  if (error) rpcError(error);
}

export function formatOperatorMoney(amount: number) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export type OperatorPassenger = {
  bookingId: string;
  fullName: string;
  phoneNumber: string;
  passengerNames: string | null;
  seatsCount: number;
  flightNumber: string | null;
  flightOrigin: string | null;
  flightScheduledTime: string | null;
  meetingPoint: string | null;
  luggageCount: number;
  status: string;
};

export async function getOperatorTripPassengers(token: string, assignmentId: string): Promise<OperatorPassenger[]> {
  const { data, error } = await supabase.rpc("get_operator_trip_passengers", {
    p_access_token: token,
    p_assignment_id: assignmentId,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    bookingId: String(r["booking_id"]),
    fullName: String(r["full_name"] ?? "—"),
    phoneNumber: String(r["phone_number"] ?? "—"),
    passengerNames: (r["passenger_names"] as string | null) ?? null,
    seatsCount: num(r["seats_count"]),
    flightNumber: (r["flight_number"] as string | null) ?? null,
    flightOrigin: (r["flight_origin"] as string | null) ?? null,
    flightScheduledTime: (r["flight_scheduled_time"] as string | null) ?? null,
    meetingPoint: (r["meeting_point"] as string | null) ?? null,
    luggageCount: num(r["luggage_count"]),
    status: String(r["status"] ?? "confirmed"),
  }));
}
