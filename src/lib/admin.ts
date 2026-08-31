import { supabase } from "./supabase";

export const ADMIN_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";

export function isAdminAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === ADMIN_AUTH_ERROR;
}

function rpcError(error: { message?: string }): never {
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("رمز الدخول") || message.includes("token")) {
    throw new Error(ADMIN_AUTH_ERROR);
  }
  throw new Error(error.message || "حصل خطأ مؤقت. حاول تاني.");
}

export type AdminBookingRow = {
  bookingId: string;
  ticketCode: string | null;
  fullName: string;
  phoneNumber: string;
  travelDate: string;
  travelDatetime: string | null;
  seatsCount: number;
  status: string;
  destination: string;
  origin: string;
  expectedTotalUsd: number | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paymentAmountUsd: number | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  paymentReviewStatus: string | null;
  scheduleId: string | null;
  tripAssignmentId: string | null;
  driverName: string | null;
  vehiclePlate: string | null;
};

function mapBookingRow(row: Record<string, unknown>): AdminBookingRow {
  return {
    bookingId: String(row["booking_id"]),
    ticketCode: (row["ticket_code"] as string | null) ?? null,
    fullName: String(row["full_name"] ?? ""),
    phoneNumber: String(row["phone_number"] ?? ""),
    travelDate: String(row["travel_date"] ?? ""),
    travelDatetime: (row["travel_datetime"] as string | null) ?? null,
    seatsCount: Number(row["seats_count"] ?? 0),
    status: String(row["status"] ?? "pending"),
    destination: String(row["destination"] ?? "—"),
    origin: String(row["origin"] ?? "—"),
    expectedTotalUsd: row["expected_total_usd"] == null ? null : Number(row["expected_total_usd"]),
    paymentId: (row["payment_id"] as string | null) ?? null,
    paymentMethod: (row["payment_method"] as string | null) ?? null,
    paymentAmountUsd: row["payment_amount_usd"] == null ? null : Number(row["payment_amount_usd"]),
    paymentReference: (row["payment_reference"] as string | null) ?? null,
    paymentProofUrl: (row["payment_proof_url"] as string | null) ?? null,
    paymentReviewStatus: (row["payment_review_status"] as string | null) ?? null,
    scheduleId: (row["schedule_id"] as string | null) ?? null,
    tripAssignmentId: (row["trip_assignment_id"] as string | null) ?? null,
    driverName: (row["driver_name"] as string | null) ?? null,
    vehiclePlate: (row["vehicle_plate"] as string | null) ?? null,
  };
}

export async function adminListBookings(
  token: string,
  status: string | null = null,
): Promise<AdminBookingRow[]> {
  const { data, error } = await supabase.rpc("admin_list_bookings", {
    p_access_token: token,
    p_status: status,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapBookingRow);
}

export async function adminConfirmPayment(token: string, paymentId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_confirm_payment", {
    p_access_token: token,
    p_payment_id: paymentId,
  });
  if (error) rpcError(error);
}

export async function adminRejectPayment(token: string, paymentId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_reject_payment", {
    p_access_token: token,
    p_payment_id: paymentId,
  });
  if (error) rpcError(error);
}

export type AdminDriver = { id: string; full_name: string; phone_number: string; operator_name: string | null };

export async function adminListDrivers(token: string): Promise<AdminDriver[]> {
  const { data, error } = await supabase.rpc("admin_list_drivers", { p_access_token: token });
  if (error) rpcError(error);
  return (data ?? []) as AdminDriver[];
}

export type AdminVehicle = {
  id: string;
  plate_number: string;
  country: string;
  vehicle_type_id: string;
  vehicle_label: string;
  capacity: number;
  driver_id: string | null;
  operator_name: string | null;
};

export async function adminListVehicles(token: string): Promise<AdminVehicle[]> {
  const { data, error } = await supabase.rpc("admin_list_vehicles", { p_access_token: token });
  if (error) rpcError(error);
  return (data ?? []) as AdminVehicle[];
}

export type AdminOperator = { id: string; name: string };

export async function adminListOperators(token: string): Promise<AdminOperator[]> {
  const { data, error } = await supabase.rpc("admin_list_operators", { p_access_token: token });
  if (error) rpcError(error);
  return (data ?? []) as AdminOperator[];
}

export async function adminAddDriver(token: string, fullName: string, phoneNumber: string, operatorId: string | null = null) {
  const { error } = await supabase.rpc("admin_add_driver", {
    p_access_token: token,
    p_full_name: fullName,
    p_phone_number: phoneNumber,
    p_operator_id: operatorId,
  });
  if (error) rpcError(error);
}

export async function adminAddVehicle(
  token: string,
  vehicleTypeId: string,
  plateNumber: string,
  country: string,
  driverId: string | null,
  operatorId: string | null = null,
) {
  const { error } = await supabase.rpc("admin_add_vehicle", {
    p_access_token: token,
    p_vehicle_type_id: vehicleTypeId,
    p_plate_number: plateNumber,
    p_country: country,
    p_driver_id: driverId,
    p_operator_id: operatorId,
  });
  if (error) rpcError(error);
}

export async function adminAssignTrip(
  token: string,
  scheduleId: string,
  travelDate: string,
  vehicleId: string,
  driverId: string,
) {
  const { error } = await supabase.rpc("admin_assign_trip", {
    p_access_token: token,
    p_schedule_id: scheduleId,
    p_travel_date: travelDate,
    p_vehicle_id: vehicleId,
    p_driver_id: driverId,
  });
  if (error) rpcError(error);
}

export function formatAdminMoney(amount: number | null) {
  if (amount == null) return "—";
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  bank_transfer: "تحويل بنكي",
  cash_on_arrival: "كاش عند الوصول",
  international_card: "بطاقة دولية",
};

export function paymentMethodLabel(method: string | null) {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function bookingStatusLabel(status: string) {
  const map: Record<string, string> = { pending: "قيد الانتظار", confirmed: "مؤكد", cancelled: "ملغي" };
  return map[status] ?? status;
}

export function reviewStatusLabel(status: string | null) {
  const map: Record<string, string> = {
    pending_review: "بانتظار المراجعة",
    confirmed: "تم التأكيد",
    rejected: "مرفوض",
  };
  if (!status) return "لسه مفيش دفع";
  return map[status] ?? status;
}

export type CustomRequestRow = {
  id: string;
  country: string;
  routeName: string;
  preferredDate: string | null;
  preferredTimeNote: string | null;
  passengerName: string;
  phone: string;
  pax: number;
  tier: string | null;
  status: string;
  createdAt: string;
};

function mapCustomRequest(row: Record<string, unknown>): CustomRequestRow {
  return {
    id: String(row["id"]),
    country: String(row["country"] ?? ""),
    routeName: String(row["route_name"] ?? ""),
    preferredDate: (row["preferred_date"] as string | null) ?? null,
    preferredTimeNote: (row["preferred_time_note"] as string | null) ?? null,
    passengerName: String(row["passenger_name"] ?? ""),
    phone: String(row["phone"] ?? ""),
    pax: Number(row["pax"] ?? 0),
    tier: (row["tier"] as string | null) ?? null,
    status: String(row["status"] ?? "pending"),
    createdAt: String(row["created_at"] ?? ""),
  };
}

export async function adminListCustomRequests(token: string): Promise<CustomRequestRow[]> {
  const { data, error } = await supabase.rpc("admin_list_custom_requests", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapCustomRequest);
}

export async function adminUpdateCustomRequestStatus(token: string, requestId: string, status: string) {
  const { error } = await supabase.rpc("admin_update_custom_request_status", {
    p_access_token: token,
    p_request_id: requestId,
    p_status: status,
  });
  if (error) rpcError(error);
}

export type ContactMessageRow = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  message: string;
  status: string;
  createdAt: string;
};

function mapContactMessage(row: Record<string, unknown>): ContactMessageRow {
  return {
    id: String(row["id"]),
    fullName: String(row["full_name"] ?? ""),
    email: (row["email"] as string | null) ?? null,
    phoneNumber: (row["phone_number"] as string | null) ?? null,
    message: String(row["message"] ?? ""),
    status: String(row["status"] ?? "new"),
    createdAt: String(row["created_at"] ?? ""),
  };
}

export async function adminListContactMessages(token: string): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase.rpc("admin_list_contact_messages", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapContactMessage);
}

export async function adminUpdateContactMessageStatus(token: string, messageId: string, status: string) {
  const { error } = await supabase.rpc("admin_update_contact_message_status", {
    p_access_token: token,
    p_message_id: messageId,
    p_status: status,
  });
  if (error) rpcError(error);
}

export function customRequestStatusLabel(status: string) {
  const map: Record<string, string> = { pending: "جديد", contacted: "تم التواصل", closed: "مغلق" };
  return map[status] ?? status;
}

export function contactMessageStatusLabel(status: string) {
  const map: Record<string, string> = { new: "جديدة", read: "مقروءة", replied: "تم الرد" };
  return map[status] ?? status;
}

export type AdminPackage = {
  id: string;
  name: string;
  tagline: string | null;
  priceUsd: number;
  iconName: string;
  features: string[];
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

function mapAdminPackage(r: Record<string, unknown>): AdminPackage {
  return {
    id: String(r["id"]),
    name: String(r["name"] ?? ""),
    tagline: (r["tagline"] as string | null) ?? null,
    priceUsd: Number(r["price_usd"] ?? 0),
    iconName: String(r["icon_name"] ?? "Sparkles"),
    features: (r["features"] as string[]) ?? [],
    isHighlighted: r["is_highlighted"] === true,
    isActive: r["is_active"] === true,
    sortOrder: Number(r["sort_order"] ?? 0),
  };
}

export async function adminListPackages(token: string): Promise<AdminPackage[]> {
  const { data, error } = await supabase.rpc("admin_list_packages", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdminPackage);
}

export async function adminCreatePackage(
  token: string,
  pkg: { name: string; tagline: string; priceUsd: number; iconName: string; features: string[]; isHighlighted: boolean; sortOrder: number },
) {
  const { error } = await supabase.rpc("admin_create_package", {
    p_access_token: token,
    p_name: pkg.name,
    p_tagline: pkg.tagline,
    p_price_usd: pkg.priceUsd,
    p_icon_name: pkg.iconName,
    p_features: pkg.features,
    p_is_highlighted: pkg.isHighlighted,
    p_sort_order: pkg.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminUpdatePackage(
  token: string,
  pkg: AdminPackage,
) {
  const { error } = await supabase.rpc("admin_update_package", {
    p_access_token: token,
    p_id: pkg.id,
    p_name: pkg.name,
    p_tagline: pkg.tagline,
    p_price_usd: pkg.priceUsd,
    p_icon_name: pkg.iconName,
    p_features: pkg.features,
    p_is_highlighted: pkg.isHighlighted,
    p_is_active: pkg.isActive,
    p_sort_order: pkg.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminDeletePackage(token: string, id: string) {
  const { error } = await supabase.rpc("admin_delete_package", { p_access_token: token, p_id: id });
  if (error) rpcError(error);
}
