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

export type AdminTripOptionRow = {
  tripOptionId: string;
  tripId: string;
  country: string;
  airportName: string;
  origin: string;
  destination: string;
  tripIsActive: boolean;
  vehicleTypeId: string;
  vehicleCode: string;
  vehicleLabelAr: string;
  bookingType: string;
  priceUsd: number;
  optionIsActive: boolean;
};

function mapAdminTripOption(r: Record<string, unknown>): AdminTripOptionRow {
  return {
    tripOptionId: String(r["trip_option_id"]),
    tripId: String(r["trip_id"]),
    country: String(r["country"] ?? ""),
    airportName: String(r["airport_name"] ?? ""),
    origin: String(r["origin"] ?? ""),
    destination: String(r["destination"] ?? ""),
    tripIsActive: r["trip_is_active"] === true,
    vehicleTypeId: String(r["vehicle_type_id"]),
    vehicleCode: String(r["vehicle_code"] ?? ""),
    vehicleLabelAr: String(r["vehicle_label_ar"] ?? ""),
    bookingType: String(r["booking_type"] ?? ""),
    priceUsd: Number(r["price_usd"] ?? 0),
    optionIsActive: r["option_is_active"] === true,
  };
}

export async function adminListTripOptions(token: string): Promise<AdminTripOptionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_trip_options", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdminTripOption);
}

export async function adminUpdateTripOptionPrice(
  token: string,
  tripOptionId: string,
  priceUsd: number,
  isActive?: boolean,
) {
  const { error } = await supabase.rpc("admin_update_trip_option_price", {
    p_access_token: token,
    p_trip_option_id: tripOptionId,
    p_price_usd: priceUsd,
    p_is_active: isActive ?? null,
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

export type AdminAddonService = {
  id: string;
  nameAr: string;
  descriptionAr: string | null;
  category: string;
  priceUsd: number;
  iconName: string;
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

function mapAdminAddonService(r: Record<string, unknown>): AdminAddonService {
  return {
    id: String(r["id"]),
    nameAr: String(r["name_ar"] ?? ""),
    descriptionAr: (r["description_ar"] as string | null) ?? null,
    category: String(r["category"] ?? ""),
    priceUsd: Number(r["price_usd"] ?? 0),
    iconName: String(r["icon_name"] ?? "Sparkles"),
    isHighlighted: r["is_highlighted"] === true,
    isActive: r["is_active"] === true,
    sortOrder: Number(r["sort_order"] ?? 0),
  };
}

export async function adminListAddonServices(token: string): Promise<AdminAddonService[]> {
  const { data, error } = await supabase.rpc("admin_list_addon_services", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdminAddonService);
}

export async function adminCreateAddonService(
  token: string,
  addon: { nameAr: string; descriptionAr: string; category: string; priceUsd: number; iconName: string; isHighlighted: boolean; sortOrder: number },
) {
  const { error } = await supabase.rpc("admin_create_addon_service", {
    p_access_token: token,
    p_name_ar: addon.nameAr,
    p_description_ar: addon.descriptionAr,
    p_category: addon.category,
    p_price_usd: addon.priceUsd,
    p_icon_name: addon.iconName,
    p_is_highlighted: addon.isHighlighted,
    p_sort_order: addon.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminUpdateAddonService(token: string, addon: AdminAddonService) {
  const { error } = await supabase.rpc("admin_update_addon_service", {
    p_access_token: token,
    p_id: addon.id,
    p_name_ar: addon.nameAr,
    p_description_ar: addon.descriptionAr,
    p_category: addon.category,
    p_price_usd: addon.priceUsd,
    p_icon_name: addon.iconName,
    p_is_highlighted: addon.isHighlighted,
    p_is_active: addon.isActive,
    p_sort_order: addon.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminDeleteAddonService(token: string, id: string) {
  const { error } = await supabase.rpc("admin_delete_addon_service", { p_access_token: token, p_id: id });
  if (error) rpcError(error);
}

export type AdminSubscriptionPlan = {
  id: string;
  country: string;
  tier: string;
  duration: string;
  name: string;
  tagline: string | null;
  priceUsd: number;
  discountPercent: number;
  freeRideCredits: number;
  extraLuggagePieces: number;
  prioritySupport: boolean;
  guaranteedSeat: boolean;
  iconName: string;
  features: string[];
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

function mapAdminSubscriptionPlan(r: Record<string, unknown>): AdminSubscriptionPlan {
  return {
    id: String(r["id"]),
    country: String(r["country"] ?? ""),
    tier: String(r["tier"] ?? ""),
    duration: String(r["duration"] ?? ""),
    name: String(r["name"] ?? ""),
    tagline: (r["tagline"] as string | null) ?? null,
    priceUsd: Number(r["price_usd"] ?? 0),
    discountPercent: Number(r["discount_percent"] ?? 0),
    freeRideCredits: Number(r["free_ride_credits"] ?? 0),
    extraLuggagePieces: Number(r["extra_luggage_pieces"] ?? 0),
    prioritySupport: r["priority_support"] === true,
    guaranteedSeat: r["guaranteed_seat"] === true,
    iconName: String(r["icon_name"] ?? "Sparkles"),
    features: (r["features"] as string[]) ?? [],
    isHighlighted: r["is_highlighted"] === true,
    isActive: r["is_active"] === true,
    sortOrder: Number(r["sort_order"] ?? 0),
  };
}

export async function adminListSubscriptionPlans(token: string): Promise<AdminSubscriptionPlan[]> {
  const { data, error } = await supabase.rpc("admin_list_subscription_plans", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdminSubscriptionPlan);
}

export async function adminCreateSubscriptionPlan(
  token: string,
  plan: {
    country: string; tier: string; duration: string; name: string; tagline: string; priceUsd: number;
    discountPercent: number; freeRideCredits: number; extraLuggagePieces: number; prioritySupport: boolean;
    guaranteedSeat: boolean; iconName: string; features: string[]; isHighlighted: boolean; sortOrder: number;
  },
) {
  const { error } = await supabase.rpc("admin_create_subscription_plan", {
    p_access_token: token,
    p_country: plan.country,
    p_tier: plan.tier,
    p_duration: plan.duration,
    p_name: plan.name,
    p_tagline: plan.tagline,
    p_price_usd: plan.priceUsd,
    p_discount_percent: plan.discountPercent,
    p_free_ride_credits: plan.freeRideCredits,
    p_extra_luggage_pieces: plan.extraLuggagePieces,
    p_priority_support: plan.prioritySupport,
    p_guaranteed_seat: plan.guaranteedSeat,
    p_icon_name: plan.iconName,
    p_features: plan.features,
    p_is_highlighted: plan.isHighlighted,
    p_sort_order: plan.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminUpdateSubscriptionPlan(token: string, plan: AdminSubscriptionPlan) {
  const { error } = await supabase.rpc("admin_update_subscription_plan", {
    p_access_token: token,
    p_id: plan.id,
    p_country: plan.country,
    p_tier: plan.tier,
    p_duration: plan.duration,
    p_name: plan.name,
    p_tagline: plan.tagline,
    p_price_usd: plan.priceUsd,
    p_discount_percent: plan.discountPercent,
    p_free_ride_credits: plan.freeRideCredits,
    p_extra_luggage_pieces: plan.extraLuggagePieces,
    p_priority_support: plan.prioritySupport,
    p_guaranteed_seat: plan.guaranteedSeat,
    p_icon_name: plan.iconName,
    p_features: plan.features,
    p_is_highlighted: plan.isHighlighted,
    p_is_active: plan.isActive,
    p_sort_order: plan.sortOrder,
  });
  if (error) rpcError(error);
}

export async function adminDeleteSubscriptionPlan(token: string, id: string) {
  const { error } = await supabase.rpc("admin_delete_subscription_plan", { p_access_token: token, p_id: id });
  if (error) rpcError(error);
}

// --- Rental partner applications (car rental / "أجّر عربيتك") ---

export type RentalPartnerApplicationRow = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  country: string;
  city: string | null;
  carMakeModel: string;
  carYear: number | null;
  categoryId: string | null;
  hasDriverLicense: boolean;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

function mapRentalPartnerApplication(row: Record<string, unknown>): RentalPartnerApplicationRow {
  return {
    id: String(row["id"]),
    fullName: String(row["full_name"] ?? ""),
    phoneNumber: String(row["phone_number"] ?? ""),
    email: (row["email"] as string | null) ?? null,
    country: String(row["country"] ?? ""),
    city: (row["city"] as string | null) ?? null,
    carMakeModel: String(row["car_make_model"] ?? ""),
    carYear: row["car_year"] == null ? null : Number(row["car_year"]),
    categoryId: (row["category_id"] as string | null) ?? null,
    hasDriverLicense: Boolean(row["has_driver_license"]),
    notes: (row["notes"] as string | null) ?? null,
    status: String(row["status"] ?? "pending_review"),
    adminNotes: (row["admin_notes"] as string | null) ?? null,
    reviewedAt: (row["reviewed_at"] as string | null) ?? null,
    createdAt: String(row["created_at"] ?? ""),
  };
}

export async function adminListRentalPartnerApplications(token: string): Promise<RentalPartnerApplicationRow[]> {
  const { data, error } = await supabase.rpc("admin_list_rental_partner_applications", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRentalPartnerApplication);
}

export async function adminUpdateRentalPartnerApplicationStatus(
  token: string,
  applicationId: string,
  status: string,
  adminNotes?: string,
) {
  const { error } = await supabase.rpc("admin_update_rental_partner_application_status", {
    p_access_token: token,
    p_application_id: applicationId,
    p_status: status,
    p_admin_notes: adminNotes ?? null,
  });
  if (error) rpcError(error);
}

export async function adminApproveRentalPartnerApplication(
  token: string,
  params: {
    applicationId: string;
    plateNumber: string;
    hourlyRateUsd: number | null;
    dailyRateUsd: number;
    multiDayRateUsd: number | null;
    multiDayThresholdDays: number;
    minRentalHours: number;
    description: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_approve_rental_partner_application", {
    p_access_token: token,
    p_application_id: params.applicationId,
    p_plate_number: params.plateNumber,
    p_hourly_rate_usd: params.hourlyRateUsd,
    p_daily_rate_usd: params.dailyRateUsd,
    p_multi_day_rate_usd: params.multiDayRateUsd,
    p_multi_day_threshold_days: params.multiDayThresholdDays,
    p_min_rental_hours: params.minRentalHours,
    p_description: params.description,
  });
  if (error) rpcError(error);
  return String(data);
}

export function rentalApplicationStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_review: "جديد",
    contacted: "تم التواصل",
    approved: "متمت الموافقة",
    rejected: "مرفوض",
  };
  return map[status] ?? status;
}

// --- Rental vehicles (car rental listings) ---

export type AdminRentalVehicle = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  categoryId: string | null;
  categoryLabelAr: string | null;
  country: string;
  plateNumber: string;
  makeModel: string;
  photos: string[];
  description: string | null;
  hourlyRateUsd: number | null;
  dailyRateUsd: number;
  multiDayRateUsd: number | null;
  multiDayThresholdDays: number;
  minRentalHours: number;
  approvalStatus: string;
  adminNotes: string | null;
  isActive: boolean;
  createdAt: string;
};

function mapAdminRentalVehicle(row: Record<string, unknown>): AdminRentalVehicle {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    partnerName: String(row["partner_name"] ?? ""),
    partnerPhone: String(row["partner_phone"] ?? ""),
    categoryId: (row["category_id"] as string | null) ?? null,
    categoryLabelAr: (row["category_label_ar"] as string | null) ?? null,
    country: String(row["country"] ?? ""),
    plateNumber: String(row["plate_number"] ?? ""),
    makeModel: String(row["make_model"] ?? ""),
    photos: (row["photos"] as string[] | null) ?? [],
    description: (row["description"] as string | null) ?? null,
    hourlyRateUsd: row["hourly_rate_usd"] == null ? null : Number(row["hourly_rate_usd"]),
    dailyRateUsd: Number(row["daily_rate_usd"] ?? 0),
    multiDayRateUsd: row["multi_day_rate_usd"] == null ? null : Number(row["multi_day_rate_usd"]),
    multiDayThresholdDays: Number(row["multi_day_threshold_days"] ?? 3),
    minRentalHours: Number(row["min_rental_hours"] ?? 3),
    approvalStatus: String(row["approval_status"] ?? "pending_review"),
    adminNotes: (row["admin_notes"] as string | null) ?? null,
    isActive: Boolean(row["is_active"]),
    createdAt: String(row["created_at"] ?? ""),
  };
}

export async function adminListRentalVehicles(token: string): Promise<AdminRentalVehicle[]> {
  const { data, error } = await supabase.rpc("admin_list_rental_vehicles", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapAdminRentalVehicle);
}

export async function adminUpdateRentalVehicle(
  token: string,
  vehicle: {
    id: string;
    categoryId: string | null;
    plateNumber: string;
    makeModel: string;
    description: string | null;
    hourlyRateUsd: number | null;
    dailyRateUsd: number;
    multiDayRateUsd: number | null;
    multiDayThresholdDays: number;
    minRentalHours: number;
    approvalStatus: string;
    adminNotes: string | null;
    isActive: boolean;
  },
) {
  const { error } = await supabase.rpc("admin_update_rental_vehicle", {
    p_access_token: token,
    p_id: vehicle.id,
    p_category_id: vehicle.categoryId,
    p_plate_number: vehicle.plateNumber,
    p_make_model: vehicle.makeModel,
    p_description: vehicle.description,
    p_hourly_rate_usd: vehicle.hourlyRateUsd,
    p_daily_rate_usd: vehicle.dailyRateUsd,
    p_multi_day_rate_usd: vehicle.multiDayRateUsd,
    p_multi_day_threshold_days: vehicle.multiDayThresholdDays,
    p_min_rental_hours: vehicle.minRentalHours,
    p_approval_status: vehicle.approvalStatus,
    p_admin_notes: vehicle.adminNotes,
    p_is_active: vehicle.isActive,
  });
  if (error) rpcError(error);
}

export async function adminAddRentalVehicle(
  token: string,
  params: {
    partnerFullName: string;
    partnerPhone: string;
    partnerCountry: string;
    categoryId: string | null;
    plateNumber: string;
    makeModel: string;
    description: string | null;
    hourlyRateUsd: number | null;
    dailyRateUsd: number;
    multiDayRateUsd: number | null;
    multiDayThresholdDays: number;
    minRentalHours: number;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_add_rental_vehicle", {
    p_access_token: token,
    p_partner_full_name: params.partnerFullName,
    p_partner_phone: params.partnerPhone,
    p_partner_country: params.partnerCountry,
    p_category_id: params.categoryId,
    p_plate_number: params.plateNumber,
    p_make_model: params.makeModel,
    p_description: params.description,
    p_hourly_rate_usd: params.hourlyRateUsd,
    p_daily_rate_usd: params.dailyRateUsd,
    p_multi_day_rate_usd: params.multiDayRateUsd,
    p_multi_day_threshold_days: params.multiDayThresholdDays,
    p_min_rental_hours: params.minRentalHours,
  });
  if (error) rpcError(error);
  return String(data);
}

export function rentalVehicleApprovalLabel(status: string) {
  const map: Record<string, string> = {
    pending_review: "قيد المراجعة",
    approved: "معتمدة",
    rejected: "مرفوضة",
  };
  return map[status] ?? status;
}
