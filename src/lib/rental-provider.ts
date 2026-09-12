import { supabase } from "./supabase";

export const RENTAL_PROVIDER_AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";
export function isRentalProviderAuthError(error: unknown) {
  return error instanceof Error && error.message === RENTAL_PROVIDER_AUTH_ERROR;
}
function rpcError(error: { message?: string }): never {
  throw new Error(
    error.message?.includes("رمز الدخول") ? RENTAL_PROVIDER_AUTH_ERROR : error.message || "حصل خطأ.",
  );
}

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending_review: "قيد المراجعة",
  approved: "معتمدة — ظاهرة للعملاء",
  rejected: "مرفوضة",
};

export type RentalProviderProfile = {
  id: string;
  fullName: string;
  companyName: string | null;
  providerType: "individual" | "company";
  phoneNumber: string;
  email: string | null;
  country: string;
  verificationStatus: "pending_review" | "verified" | "rejected";
  verifiedAt: string | null;
  rejectionReason: string | null;
};

export const VERIFICATION_STATUS_LABELS: Record<RentalProviderProfile["verificationStatus"], string> = {
  pending_review: "بانتظار الاعتماد من فريق GoAir",
  verified: "معتمد",
  rejected: "مرفوض",
};

export async function getRentalProviderProfile(token: string): Promise<RentalProviderProfile> {
  const { data, error } = await supabase.rpc("rental_partner_get_profile", { p_access_token: token });
  if (error) rpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error(RENTAL_PROVIDER_AUTH_ERROR);
  return {
    id: String(row["id"]),
    fullName: String(row["full_name"]),
    companyName: (row["company_name"] as string | null) ?? null,
    providerType: row["provider_type"] === "company" ? "company" : "individual",
    phoneNumber: String(row["phone_number"]),
    email: (row["email"] as string | null) ?? null,
    country: String(row["country"]),
    verificationStatus:
      row["verification_status"] === "verified"
        ? "verified"
        : row["verification_status"] === "rejected"
          ? "rejected"
          : "pending_review",
    verifiedAt: (row["verified_at"] as string | null) ?? null,
    rejectionReason: (row["rejection_reason"] as string | null) ?? null,
  };
}

export type RentalProviderVehicle = {
  id: string;
  categoryId: string;
  country: string;
  city: string | null;
  pickupAreaId: string | null;
  pickupAreaCustom: string | null;
  plateNumber: string;
  makeModel: string;
  photos: string[];
  description: string | null;
  hourlyRateUsd: number | null;
  dailyRateUsd: number;
  multiDayRateUsd: number | null;
  multiDayThresholdDays: number;
  minRentalHours: number;
  transmission: string;
  fuelType: string;
  seats: number | null;
  dailyMileageLimitKm: number | null;
  insuranceIncluded: boolean;
  approvalStatus: string;
  isActive: boolean;
  createdAt: string;
};

function mapVehicle(row: Record<string, unknown>): RentalProviderVehicle {
  return {
    id: String(row["id"]),
    categoryId: String(row["category_id"]),
    country: String(row["country"]),
    city: (row["city"] as string | null) ?? null,
    pickupAreaId: (row["pickup_area_id"] as string | null) ?? null,
    pickupAreaCustom: (row["pickup_area_custom"] as string | null) ?? null,
    plateNumber: String(row["plate_number"]),
    makeModel: String(row["make_model"]),
    photos: (row["photos"] as string[] | null) ?? [],
    description: (row["description"] as string | null) ?? null,
    hourlyRateUsd: row["hourly_rate_usd"] != null ? Number(row["hourly_rate_usd"]) : null,
    dailyRateUsd: Number(row["daily_rate_usd"] ?? 0),
    multiDayRateUsd: row["multi_day_rate_usd"] != null ? Number(row["multi_day_rate_usd"]) : null,
    multiDayThresholdDays: Number(row["multi_day_threshold_days"] ?? 3),
    minRentalHours: Number(row["min_rental_hours"] ?? 3),
    transmission: String(row["transmission"] ?? ""),
    fuelType: String(row["fuel_type"] ?? ""),
    seats: row["seats"] != null ? Number(row["seats"]) : null,
    dailyMileageLimitKm: row["daily_mileage_limit_km"] != null ? Number(row["daily_mileage_limit_km"]) : null,
    insuranceIncluded: Boolean(row["insurance_included"]),
    approvalStatus: String(row["approval_status"]),
    isActive: Boolean(row["is_active"]),
    createdAt: String(row["created_at"]),
  };
}

export async function listRentalProviderVehicles(token: string): Promise<RentalProviderVehicle[]> {
  const { data, error } = await supabase.rpc("rental_partner_list_vehicles", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapVehicle);
}

// أقصى عدد صور لكل عربية، وأقصى حجم للصورة الواحدة (ميجابايت).
export const MAX_VEHICLE_PHOTOS = 6;
export const MAX_VEHICLE_PHOTO_SIZE_MB = 5;

// بيرفع كل صورة لباكت "rental-vehicle-photos" (public) ويرجع الروابط العامة
// بنفس الترتيب. أي صورة تفشل بتوقف الرفع كله وترمي خطأ واضح بدل ما تسيب
// عربية بصور ناقصة من غير ما المستخدم يعرف.
export async function uploadRentalVehiclePhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_VEHICLE_PHOTO_SIZE_MB * 1024 * 1024) {
      throw new Error(`الصورة "${file.name}" أكبر من ${MAX_VEHICLE_PHOTO_SIZE_MB} ميجا.`);
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("rental-vehicle-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
    if (error) throw new Error(error.message || `فشل رفع الصورة "${file.name}".`);
    const { data } = supabase.storage.from("rental-vehicle-photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function addRentalProviderVehicle(
  token: string,
  input: {
    categoryId: string;
    country: string;
    plateNumber: string;
    makeModel: string;
    transmission: string;
    fuelType: string;
    dailyRateUsd: number;
    hourlyRateUsd: number | null;
    multiDayRateUsd: number | null;
    seats: number | null;
    description: string | null;
    photos?: string[];
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("rental_partner_add_vehicle", {
    p_access_token: token,
    p_category_id: input.categoryId,
    p_country: input.country,
    p_plate_number: input.plateNumber,
    p_make_model: input.makeModel,
    p_transmission: input.transmission,
    p_fuel_type: input.fuelType,
    p_daily_rate_usd: input.dailyRateUsd,
    p_hourly_rate_usd: input.hourlyRateUsd,
    p_multi_day_rate_usd: input.multiDayRateUsd,
    p_seats: input.seats,
    p_description: input.description,
    p_photos: input.photos ?? [],
  });
  if (error) rpcError(error);
  return String(data);
}

export async function updateRentalProviderVehicle(
  token: string,
  vehicleId: string,
  input: Partial<{
    plateNumber: string;
    makeModel: string;
    dailyRateUsd: number;
    hourlyRateUsd: number | null;
    multiDayRateUsd: number | null;
    description: string | null;
    isActive: boolean;
    photos: string[];
  }>,
): Promise<void> {
  const { error } = await supabase.rpc("rental_partner_update_vehicle", {
    p_access_token: token,
    p_vehicle_id: vehicleId,
    p_plate_number: input.plateNumber ?? null,
    p_make_model: input.makeModel ?? null,
    p_daily_rate_usd: input.dailyRateUsd ?? null,
    p_hourly_rate_usd: input.hourlyRateUsd ?? null,
    p_multi_day_rate_usd: input.multiDayRateUsd ?? null,
    p_description: input.description ?? null,
    p_is_active: input.isActive ?? null,
    p_photos: input.photos ?? null,
  });
  if (error) rpcError(error);
}

// Separate RPC (not part of updateRentalProviderVehicle) because pickup
// area needs exactly one of a normalized area id OR free-text custom area —
// enforced by rental_partner_update_vehicle_pickup_area itself.
export async function updateRentalProviderVehiclePickupArea(
  token: string,
  vehicleId: string,
  city: string,
  pickupAreaId: string | null,
  pickupAreaCustom: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("rental_partner_update_vehicle_pickup_area", {
    p_token: token,
    p_vehicle_id: vehicleId,
    p_city: city,
    p_pickup_area_id: pickupAreaId,
    p_pickup_area_custom: pickupAreaCustom,
  });
  if (error) rpcError(error);
}

export type RentalProviderBooking = {
  id: string;
  vehicleId: string;
  vehicleMakeModel: string;
  customerName: string;
  customerPhone: string;
  startDatetime: string;
  endDatetime: string;
  durationType: string;
  pickupLocation: string;
  totalUsd: number;
  status: string;
  createdAt: string;
};

export async function listRentalProviderBookings(token: string): Promise<RentalProviderBooking[]> {
  const { data, error } = await supabase.rpc("rental_partner_list_bookings", { p_access_token: token });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row["id"]),
    vehicleId: String(row["rental_vehicle_id"]),
    vehicleMakeModel: String(row["vehicle_make_model"]),
    customerName: String(row["full_name"]),
    customerPhone: String(row["phone_number"]),
    startDatetime: String(row["start_datetime"]),
    endDatetime: String(row["end_datetime"]),
    durationType: String(row["duration_type"]),
    pickupLocation: String(row["pickup_location"] ?? ""),
    totalUsd: Number(row["total_usd"] ?? 0),
    status: String(row["status"]),
    createdAt: String(row["created_at"]),
  }));
}
