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

export type OperatorTrip = {
  assignmentId: string; travelDate: string; departureTime: string | null;
  destination: string; origin: string; seatsCount: number; amountDueUsd: number;
  driverName: string | null; vehiclePlate: string;
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
  }));
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
