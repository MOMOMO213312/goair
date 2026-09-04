import { clearStoredReferralCode, getStoredReferralCode } from "./referral";
import {
  generateDepartureTimes,
  resolveServiceWindow,
  sameDeparture,
  type ScheduleConfigSource,
} from "./schedule";
import { supabase } from "./supabase";

export type Trip = {
  id: string;
  country: string;
  airport_name: string;
  airport_code: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  price_usd: number | null;
  is_active: boolean | null;
  // Optional per-route operating-window configuration (see lib/schedule.ts).
  service_start_time?: string | null;
  service_end_time?: string | null;
  departure_interval_minutes?: number | null;
  hourly_service_enabled?: boolean | null;
};

export type ScheduleOption = {
  scheduleId: string;
  tripOptionId: string | null;
  vehicleTypeId: string | null;
  departureTime: string;
  pricePerSeat: number;
  capacity: number | null;
  remainingSeats: number | null;
  /** False when the departure is sold out (kept in the list, shown as unavailable). */
  isAvailable: boolean;
};

function pick<T = unknown>(row: Record<string, unknown>, keys: string[]): T | null {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return null;
}

export type VehicleType = {
  id: string;
  code: string;
  labelAr: string;
  capacity: number;
  maxLuggage: number | null;
};

/** Real vehicle tiers from `vehicle_types` — no fabricated tiers. */
export type PackageTier = {
  id: string;
  name: string;
  tagline: string | null;
  priceUsd: number;
  iconName: string;
  features: string[];
  isHighlighted: boolean;
};

export async function fetchActivePackages(): Promise<PackageTier[]> {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(pick(row, ["id"])),
    name: String(pick(row, ["name"]) ?? ""),
    tagline: pick<string>(row, ["tagline"]),
    priceUsd: Number(pick(row, ["price_usd"]) ?? 0),
    iconName: String(pick(row, ["icon_name"]) ?? "Sparkles"),
    features: (pick<string[]>(row, ["features"]) ?? []) as string[],
    isHighlighted: pick<boolean>(row, ["is_highlighted"]) === true,
  }));
}

export async function fetchPackageById(id: string): Promise<PackageTier | null> {
  const all = await fetchActivePackages();
  return all.find((p) => p.id === id) ?? null;
}

export async function fetchVehicleTypes(): Promise<VehicleType[]> {
  const { data, error } = await supabase
    .from("vehicle_types")
    .select("*")
    .eq("is_active", true)
    .order("capacity", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(pick(row, ["id"])),
    code: String(pick(row, ["code"])),
    labelAr: String(pick(row, ["label_ar"]) ?? ""),
    capacity: Number(pick(row, ["capacity"]) ?? 0),
    maxLuggage: pick<number>(row, ["max_luggage"]),
  }));
}

/**
 * Private/charter option for one trip — book the whole vehicle instead of
 * a shared seat. `priceUsd` here is the FLAT total for the vehicle, not a
 * per-seat rate (unlike shared trip_options). Auto-priced server-side from
 * the market's average $/seat/km for that vehicle tier (see the DB function
 * `estimate_private_price`), so every route gets a sane private price
 * without pricing each one by hand.
 */
export type PrivateOption = {
  tripOptionId: string;
  vehicleTypeId: string;
  vehicleCode: string;
  vehicleLabelAr: string;
  capacity: number;
  maxLuggage: number | null;
  priceUsd: number;
};

export async function fetchPrivateTripOptions(tripId: string): Promise<PrivateOption[]> {
  const { data, error } = await supabase.rpc("get_private_trip_options", { p_trip_id: tripId });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    tripOptionId: String(pick(row, ["trip_option_id"])),
    vehicleTypeId: String(pick(row, ["vehicle_type_id"])),
    vehicleCode: String(pick(row, ["vehicle_code"]) ?? ""),
    vehicleLabelAr: String(pick(row, ["vehicle_label_ar"]) ?? ""),
    capacity: Number(pick(row, ["capacity"]) ?? 0),
    maxLuggage: pick<number>(row, ["max_luggage"]),
    priceUsd: Number(pick(row, ["price_usd"]) ?? 0),
  }));
}

export type CreatePrivateBookingInput = {
  tripId: string;
  vehicleTypeId: string;
  travelDate: string;
  travelDatetime: string | null;
  seatsCount: number;
  fullName: string;
  phoneNumber: string;
  flightNumber: string | null;
  luggageCount: number;
  referralCodeOverride?: string | null;
  packageId?: string | null;
};

/** Reserve a whole vehicle for one group — flat price, no shared-capacity contention. */
export async function createPrivateBookingSafe(input: CreatePrivateBookingInput) {
  const pendingReferralCode =
    input.referralCodeOverride !== undefined ? input.referralCodeOverride : getStoredReferralCode();

  const { data, error } = await supabase.rpc("create_private_booking_safe", {
    p_trip_id: input.tripId,
    p_vehicle_type_id: input.vehicleTypeId,
    p_travel_date: input.travelDate,
    p_travel_datetime: input.travelDatetime,
    p_seats_count: input.seatsCount,
    p_full_name: input.fullName,
    p_phone_number: input.phoneNumber,
    p_luggage_count: input.luggageCount,
    p_flight_number: input.flightNumber,
    ...(pendingReferralCode ? { p_referral_code: pendingReferralCode } : {}),
    ...(input.packageId ? { p_package_id: input.packageId } : {}),
  });

  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const ticketCode = row ? pick<string>(row, ["ticket_code"]) : null;
  if (!ticketCode) throw new Error("تم إنشاء الحجز لكن لم يرجع كود التذكرة — كلمنا فورًا على الدعم.");
  clearStoredReferralCode();
  return { ticketCode, raw: row };
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trip")
    .select("*")
    .eq("is_active", true)
    .order("country", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Trip[];
}

/**
 * Launch markets visible to the public — read from `launch_markets`
 * (is_visible_to_public = true) so opening a new market (e.g. Jordan)
 * is a DB flip, not a code change/redeploy.
 *
 * Falls back to the last-known public markets if the table isn't
 * readable yet (e.g. anon SELECT grant missing) — keeps the homepage
 * working instead of showing zero countries.
 */
const FALLBACK_PUBLIC_COUNTRIES = ["مصر", "لبنان"];

export async function fetchVisibleCountries(trips: Trip[]): Promise<string[]> {
  const available = new Set(trips.map((trip) => trip.country));

  const { data, error } = await supabase
    .from("launch_markets")
    .select("*")
    .eq("is_visible_to_public", true);

  if (error || !Array.isArray(data)) {
    return FALLBACK_PUBLIC_COUNTRIES.filter((country) => available.has(country));
  }

  const countries = (data as Record<string, unknown>[])
    .map((row) => pick<string>(row, ["country", "country_name", "name"]))
    .filter((value): value is string => Boolean(value));

  // Table read succeeded but returned nothing usable (e.g. column
  // name mismatch) — fall back rather than showing an empty homepage.
  if (countries.length === 0) {
    return FALLBACK_PUBLIC_COUNTRIES.filter((country) => available.has(country));
  }

  return countries.filter((country) => available.has(country));
}

export type PaymentMethod = {
  id: string;
  method: string;
  label: string;
  details: string | null;
  country: string | null;
};

export async function fetchPaymentMethods(country?: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase.from("payment_settings").select("*").eq("is_active", true);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PaymentMethod[];
  if (!country) return rows;
  return rows.filter((row) => !row.country || row.country === country);
}

/** Market-level schedule defaults from `launch_markets` (per-country fallback). */
async function fetchMarketScheduleConfig(country?: string): Promise<ScheduleConfigSource> {
  if (!country) return null;
  const { data, error } = await supabase
    .from("launch_markets")
    .select("*")
    .eq("country", country)
    .limit(1);
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as ScheduleConfigSource;
}

/**
 * Departures + live remaining seats for one trip on one date.
 *
 * Source of truth is the security-definer RPC `get_schedule_availability`,
 * which generates the configured hourly window, overlays explicit `schedules`
 * rows and subtracts booked seats. When the RPC isn't deployed yet we rebuild
 * the same shape client-side from the configured operating window (route →
 * market → platform default) plus whatever catalog rows are readable —
 * departures are the configured GOAIR operating rule, never random times, and
 * sold-out slots are marked unavailable rather than dropped.
 */
export async function fetchScheduleOptions(
  tripId: string,
  travelDate: string,
  fallbackTrip?: Trip,
): Promise<ScheduleOption[]> {
  const rpc = await supabase.rpc("get_schedule_availability", {
    p_trip_id: tripId,
    p_travel_date: travelDate,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    return (rpc.data as Record<string, unknown>[])
      .map((row) => {
        const remaining = pick<number>(row, ["remaining_seats", "seats_remaining"]);
        const remainingSeats = remaining == null ? null : Number(remaining);
        const explicitAvailable = pick<boolean>(row, ["is_available"]);
        return {
          scheduleId: String(pick(row, ["schedule_id", "id"]) ?? ""),
          tripOptionId: pick<string>(row, ["trip_option_id"]),
          vehicleTypeId: pick<string>(row, ["vehicle_type_id"]),
          departureTime: String(pick(row, ["departure_time", "depart_at", "time"]) ?? ""),
          pricePerSeat: Number(pick(row, ["price_usd", "price_per_seat"]) ?? 0),
          capacity: Number(pick(row, ["capacity", "total_capacity"]) ?? 0) || null,
          remainingSeats,
          isAvailable:
            explicitAvailable != null
              ? explicitAvailable === true
              : remainingSeats == null || remainingSeats > 0,
        };
      })
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }

  if (!fallbackTrip) return [];

  const [schedules, options, market] = await Promise.all([
    supabase.from("schedules").select("*").eq("trip_id", tripId),
    supabase.from("trip_options").select("*").eq("trip_id", tripId),
    fetchMarketScheduleConfig(fallbackTrip.country),
  ]);

  const scheduleRows = (schedules.error ? [] : ((schedules.data ?? []) as Record<string, unknown>[]))
    .filter((row) => pick(row, ["is_active"]) !== false);
  const optionRows = options.error ? [] : ((options.data ?? []) as Record<string, unknown>[]);

  const defaultOption = optionRows[0] ?? null;
  const defaultPrice = defaultOption
    ? Number(pick(defaultOption, ["price_usd"]) ?? 0)
    : Number(fallbackTrip.price_usd ?? 0);

  const window = resolveServiceWindow(fallbackTrip, market);
  const generatedTimes = generateDepartureTimes(window);

  // Explicit rows always win; the configured window fills the remaining hours.
  const explicit = scheduleRows.map((row) => {
    const vehicleTypeId = pick<string>(row, ["vehicle_type_id"]);
    const option =
      optionRows.find(
        (candidate) => pick<string>(candidate, ["vehicle_type_id"]) === vehicleTypeId,
      ) ?? defaultOption;
    const capacity = Number(pick(row, ["capacity_override"]) ?? 0) || null;
    return {
      scheduleId: String(pick(row, ["id"]) ?? ""),
      tripOptionId: option ? String(pick(option, ["id"])) : null,
      vehicleTypeId: vehicleTypeId ?? (option ? pick<string>(option, ["vehicle_type_id"]) : null),
      departureTime: String(pick(row, ["departure_time", "depart_at", "time"]) ?? ""),
      pricePerSeat: option ? Number(pick(option, ["price_usd"]) ?? 0) : defaultPrice,
      capacity,
      remainingSeats: null,
      isAvailable: true,
    } satisfies ScheduleOption;
  });

  const generated = generatedTimes
    .filter((time) => !explicit.some((row) => sameDeparture(row.departureTime, time)))
    .map((time) => ({
      // Deterministic id for a configured departure that has no stored row yet;
      // the booking RPC resolves/materializes it from trip + date + time.
      scheduleId: `hourly:${tripId}:${time}`,
      tripOptionId: defaultOption ? String(pick(defaultOption, ["id"])) : null,
      vehicleTypeId: defaultOption ? pick<string>(defaultOption, ["vehicle_type_id"]) : null,
      departureTime: time,
      pricePerSeat: defaultPrice,
      capacity: null,
      remainingSeats: null,
      isAvailable: true,
    }));

  return [...explicit, ...generated].sort((a, b) =>
    a.departureTime.localeCompare(b.departureTime),
  );
}

export type CreateBookingInput = {
  tripId: string;
  scheduleId: string;
  tripOptionId: string | null;
  travelDate: string;
  travelDatetime: string | null;
  departureTime: string;
  seatsCount: number;
  fullName: string;
  phoneNumber: string;
  flightNumber: string | null;
  luggageCount: number;
  /**
   * Explicit referral code to attribute this booking to — used by the
   * agency quick-booking tool, which knows its own code up front and
   * shouldn't depend on (or overwrite) whatever's in localStorage from
   * an unrelated browsing session. Falls back to the stored code when
   * omitted, same as before.
   */
  referralCodeOverride?: string | null;
  /** Selected add-on package (from /packages) — adds its price per seat. */
  packageId?: string | null;
};

/** A configured hourly departure (or legacy fallback slot) that has no stored `schedules` row yet. */
export function isGeneratedScheduleId(scheduleId: string) {
  return scheduleId.startsWith("hourly:") || scheduleId.startsWith("fallback-");
}

function isMissingDepartureParam(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST202" ||
    message.includes("p_departure_time") ||
    message.includes("could not find the function")
  );
}

/**
 * Never insert into booking directly — the DB computes the total and locks
 * capacity. Tries the schedule-materializing signature first (DB resolves or
 * creates the schedule row for an hourly departure); if the DB hasn't been
 * upgraded yet, falls back to the legacy signature for a real schedule row,
 * and blocks with a clear message for a still-generated one rather than
 * sending it to the DB as a fake UUID.
 */
export async function createBookingSafe(input: CreateBookingInput) {
  const pendingReferralCode =
    input.referralCodeOverride !== undefined ? input.referralCodeOverride : getStoredReferralCode();
  const generated = isGeneratedScheduleId(input.scheduleId);

  const baseArgs: Record<string, unknown> = {
    p_trip_id: input.tripId,
    p_trip_option_id: input.tripOptionId,
    p_travel_date: input.travelDate,
    p_travel_datetime: input.travelDatetime,
    p_seats_count: input.seatsCount,
    p_full_name: input.fullName,
    p_phone_number: input.phoneNumber,
    p_flight_number: input.flightNumber,
    p_luggage_count: input.luggageCount,
    ...(pendingReferralCode ? { p_referral_code: pendingReferralCode } : {}),
    ...(input.packageId ? { p_package_id: input.packageId } : {}),
  };

  let { data, error } = await supabase.rpc("create_booking_safe", {
    ...baseArgs,
    p_schedule_id: generated ? null : input.scheduleId,
    p_departure_time: input.departureTime,
  });

  // Database not upgraded to the schedule-materializing signature yet: fall
  // back to the signature already live today.
  if (error && isMissingDepartureParam(error)) {
    if (generated) {
      throw new Error(
        "الموعد ده لسه مش متاح للحجز الفوري — كلمنا على الدعم ونأكدلك الحجز.",
      );
    }
    ({ data, error } = await supabase.rpc("create_booking_safe", {
      ...baseArgs,
      p_schedule_id: input.scheduleId,
    }));
  }

  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const ticketCode = row ? pick<string>(row, ["ticket_code", "p_ticket_code"]) : null;
  if (!ticketCode) throw new Error("تم إنشاء الحجز لكن لم يرجع كود التذكرة — كلمنا فورًا على الدعم.");
  clearStoredReferralCode();
  return { ticketCode, raw: row };
}

export type BookingRecord = Record<string, unknown> & {
  ticket_code?: string;
  expected_total_usd?: number;
  seats_count?: number;
  status?: string;
};

export async function getBookingByTicket(ticketCode: string): Promise<BookingRecord | null> {
  const { data, error } = await supabase.rpc("get_booking_by_ticket", {
    p_ticket_code: ticketCode.trim().toUpperCase(),
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as BookingRecord) ?? null;
}

export async function cancelBookingByTicket(ticketCode: string, reason: string) {
  const { data, error } = await supabase.rpc("cancel_booking_by_ticket", {
    p_ticket_code: ticketCode.trim().toUpperCase(),
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  if (data === false) throw new Error("لم نتمكن من إلغاء الحجز — تأكد من كود التذكرة أو كلم الدعم.");
  return true;
}

/** Amount is validated by the validate_payment_amount trigger in the database. */
/**
 * Uploads a payment-proof screenshot/PDF to the `payment-proofs` storage
 * bucket and returns its public URL. Requires that bucket to exist with a
 * public-read policy — if it doesn't, this throws and the caller falls
 * back to text-only reference (never blocks the payment).
 */
export async function uploadPaymentProof(ticket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${ticket}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
  return data.publicUrl;
}

export async function submitPayment(params: {
  bookingId: string;
  method: string;
  amountUsd: number;
  referenceNumber: string | null;
  proofUrl: string | null;
}) {
  const { error } = await supabase.from("payments").insert({
    booking_id: params.bookingId,
    method: params.method,
    amount_usd: params.amountUsd,
    reference_number: params.referenceNumber,
    proof_url: params.proofUrl,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function submitCustomRequest(params: {
  country: string;
  airportCode: string;
  destination: string;
  travelDate: string;
  seats: number;
  phone: string;
}) {
  const { error } = await supabase.from("custom_requests").insert({
    country: params.country,
    airport_code: params.airportCode,
    destination: params.destination,
    travel_date: params.travelDate,
    seats_count: params.seats,
    phone_number: params.phone,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function subscribeNewsletter(email: string) {
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error) throw new Error(error.message);
  return true;
}

export async function sendContactMessage(params: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const { error } = await supabase.from("contact_messages").insert({
    full_name: params.name,
    email: params.email,
    phone_number: params.phone,
    message: params.message,
  });
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Surface the real error from a DB function/trigger to the customer
 * (per the "never a silent generic error" rule), but never leak raw
 * SQL/Postgres internals — those get replaced with the fallback.
 */
export function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const message = error.message.trim();
  const looksTechnical =
    /^(new row|duplicate key|violates|null value|permission denied|invalid input syntax|relation ".*" does not exist|column ".*" does not exist|JWT|PGRST)/i.test(
      message,
    ) || message.length > 160;
  return looksTechnical ? fallback : message;
}

export function formatUsd(amount: number) {
  return `${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}$`;
}

export function formatTime(time: string) {
  if (!time) return "";
  const [hourRaw, minute = "00"] = time.split(":");
  const hour = Number(hourRaw);
  const suffix = hour < 12 ? "ص" : "م";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute.padStart(2, "0")} ${suffix}`;
}