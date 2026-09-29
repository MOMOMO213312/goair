import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "./supabase";

/* -------------------------------------------------------------------------------------------------
 * Customer session
 * ------------------------------------------------------------------------------------------------- */

export type CustomerAuthState = {
  /** false until the first getSession() resolves, so pages don't flash the login form. */
  ready: boolean;
  session: Session | null;
  user: User | null;
};

export function useCustomerAuth(): CustomerAuthState {
  const [state, setState] = useState<CustomerAuthState>({
    ready: false,
    session: null,
    user: null,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active)
        setState({ ready: true, session: data.session, user: data.session?.user ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ ready: true, session, user: session?.user ?? null });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/* -------------------------------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------------------------------- */

export type CustomerBooking = {
  id: string;
  ticketCode: string;
  status: "pending" | "confirmed" | "cancelled";
  bookingType: "shared" | "private";
  travelDate: string | null;
  travelDatetime: string | null;
  seatsCount: number;
  luggageCount: number | null;
  meetingPoint: string | null;
  flightNumber: string | null;
  origin: string | null;
  originEn: string | null;
  destination: string | null;
  destinationEn: string | null;
  airportName: string | null;
  airportNameEn: string | null;
  country: string | null;
  direction: string | null;
  expectedTotalUsd: number | null;
  invoiceNumber: number | null;
  fullName: string | null;
  phoneNumber: string | null;
  passengerNames: string[];
  driverName: string | null;
  driverPhone: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  paymentStatus: "pending_review" | "confirmed" | "rejected" | null;
  paymentMethod: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  refundStatus: string | null;
  ratingStars: number | null;
  packageName: string | null;
  packageNameEn: string | null;
  createdAt: string;
  isUpcoming: boolean;
};

export type CustomerRental = {
  id: string;
  ticketCode: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  startDatetime: string;
  endDatetime: string;
  durationType: string | null;
  pickupLocation: string | null;
  totalUsd: number | null;
  addonsTotalUsd: number | null;
  vehicleMakeModel: string | null;
  vehiclePlate: string | null;
  vehiclePhoto: string | null;
  driverName: string | null;
  driverPhone: string | null;
  addonNames: string[];
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type CustomerSubscription = {
  id: string;
  code: string;
  status: "pending_payment" | "active" | "expired" | "cancelled";
  startsAt: string | null;
  endsAt: string | null;
  expectedTotalUsd: number | null;
  creditsRemaining: number | null;
  ridesDiscounted: number | null;
  planName: string | null;
  planNameEn: string | null;
  tier: string | null;
  duration: string | null;
  discountPercent: number | null;
  freeRideCredits: number | null;
  prioritySupport: boolean;
  guaranteedSeat: boolean;
  createdAt: string;
};

export type CustomerPayment = {
  kind: "booking" | "subscription";
  referenceCode: string;
  method: string | null;
  amountUsd: number;
  reviewStatus: "pending_review" | "confirmed" | "rejected";
  referenceNumber: string | null;
  createdAt: string;
};

export type CustomerOverview = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  awaitingPaymentCount: number;
  totalSpentUsd: number;
  unreadNotifications: number;
  nextTrip: {
    id: string;
    ticketCode: string;
    status: string;
    travelDatetime: string | null;
    travelDate: string | null;
    seatsCount: number;
    origin: string | null;
    originEn: string | null;
    destination: string | null;
    destinationEn: string | null;
    driverName: string | null;
    vehiclePlate: string | null;
  } | null;
  activeSubscription: {
    id: string;
    code: string;
    planName: string | null;
    planNameEn: string | null;
    endsAt: string | null;
    credits: number | null;
    discountPercent: number | null;
  } | null;
};

export type CustomerProfile = {
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  preferredLanguage: "ar" | "en";
  marketingOptIn: boolean;
};

export type SavedPassenger = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  relation: string | null;
};

export type CustomerNotification = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  linkPath: string | null;
  createdAt: string;
  isRead: boolean;
};

/* -------------------------------------------------------------------------------------------------
 * RPC wrappers
 * ------------------------------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

function fail(error: { message?: string }): never {
  throw new Error(error.message || "Something went wrong");
}
const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number | null => (v == null ? null : Number(v));

export async function customerSyncAccount(): Promise<{ linkedBookings: number }> {
  const { data, error } = await supabase.rpc("customer_sync_account");
  if (error) fail(error);
  return { linkedBookings: Number((data as Row | null)?.["linked_bookings"] ?? 0) };
}

export async function customerClaimByCode(
  code: string,
): Promise<{ kind: "booking" | "rental" | "subscription" }> {
  const { data, error } = await supabase.rpc("customer_claim_by_code", { p_code: code });
  if (error) fail(error);
  return { kind: String((data as Row)["kind"]) as "booking" | "rental" | "subscription" };
}

export async function customerGetOverview(): Promise<CustomerOverview> {
  const { data, error } = await supabase.rpc("customer_get_overview");
  if (error) fail(error);
  const d = (data ?? {}) as Row;
  const nt = d["next_trip"] as Row | null;
  const sub = d["active_subscription"] as Row | null;
  return {
    upcomingCount: Number(d["upcoming_count"] ?? 0),
    completedCount: Number(d["completed_count"] ?? 0),
    cancelledCount: Number(d["cancelled_count"] ?? 0),
    awaitingPaymentCount: Number(d["awaiting_payment_count"] ?? 0),
    totalSpentUsd: Number(d["total_spent_usd"] ?? 0),
    unreadNotifications: Number(d["unread_notifications"] ?? 0),
    nextTrip: nt
      ? {
          id: String(nt["id"]),
          ticketCode: String(nt["ticket_code"]),
          status: String(nt["status"]),
          travelDatetime: str(nt["travel_datetime"]),
          travelDate: str(nt["travel_date"]),
          seatsCount: Number(nt["seats_count"] ?? 1),
          origin: str(nt["origin"]),
          originEn: str(nt["origin_en"]),
          destination: str(nt["destination"]),
          destinationEn: str(nt["destination_en"]),
          driverName: str(nt["driver_name"]),
          vehiclePlate: str(nt["vehicle_plate"]),
        }
      : null,
    activeSubscription: sub
      ? {
          id: String(sub["id"]),
          code: String(sub["code"]),
          planName: str(sub["plan_name"]),
          planNameEn: str(sub["plan_name_en"]),
          endsAt: str(sub["ends_at"]),
          credits: num(sub["credits"]),
          discountPercent: num(sub["discount_percent"]),
        }
      : null,
  };
}

export async function customerListBookings(
  scope: "all" | "upcoming" | "past" = "all",
  limit = 20,
  offset = 0,
): Promise<CustomerBooking[]> {
  const { data, error } = await supabase.rpc("customer_list_bookings", {
    p_scope: scope,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r["id"]),
    ticketCode: String(r["ticket_code"] ?? ""),
    status: r["status"] as CustomerBooking["status"],
    bookingType: (r["booking_type"] as CustomerBooking["bookingType"]) ?? "shared",
    travelDate: str(r["travel_date"]),
    travelDatetime: str(r["travel_datetime"]),
    seatsCount: Number(r["seats_count"] ?? 1),
    luggageCount: num(r["luggage_count"]),
    meetingPoint: str(r["meeting_point"]),
    flightNumber: str(r["flight_number"]),
    origin: str(r["origin"]),
    originEn: str(r["origin_en"]),
    destination: str(r["destination"]),
    destinationEn: str(r["destination_en"]),
    airportName: str(r["airport_name"]),
    airportNameEn: str(r["airport_name_en"]),
    country: str(r["country"]),
    direction: str(r["direction"]),
    expectedTotalUsd: num(r["expected_total_usd"]),
    invoiceNumber: num(r["invoice_number"]),
    fullName: str(r["full_name"]),
    phoneNumber: str(r["phone_number"]),
    passengerNames: (r["passenger_names"] as string[] | null) ?? [],
    driverName: str(r["driver_name"]),
    driverPhone: str(r["driver_phone"]),
    vehiclePlate: str(r["vehicle_plate"]),
    vehicleModel: str(r["vehicle_model"]),
    paymentStatus: (r["payment_status"] as CustomerBooking["paymentStatus"]) ?? null,
    paymentMethod: str(r["payment_method"]),
    cancellationReason: str(r["cancellation_reason"]),
    cancelledAt: str(r["cancelled_at"]),
    refundStatus: str(r["refund_status"]),
    ratingStars: num(r["rating_stars"]),
    packageName: str(r["package_name"]),
    packageNameEn: str(r["package_name_en"]),
    createdAt: String(r["created_at"]),
    isUpcoming: r["is_upcoming"] === true,
  }));
}

export async function customerListRentals(): Promise<CustomerRental[]> {
  const { data, error } = await supabase.rpc("customer_list_rentals");
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r["id"]),
    ticketCode: String(r["ticket_code"] ?? ""),
    status: r["status"] as CustomerRental["status"],
    startDatetime: String(r["start_datetime"]),
    endDatetime: String(r["end_datetime"]),
    durationType: str(r["duration_type"]),
    pickupLocation: str(r["pickup_location"]),
    totalUsd: num(r["total_usd"]),
    addonsTotalUsd: num(r["addons_total_usd"]),
    vehicleMakeModel: str(r["vehicle_make_model"]),
    vehiclePlate: str(r["vehicle_plate"]),
    vehiclePhoto: str(r["vehicle_photo"]),
    driverName: str(r["driver_name"]),
    driverPhone: str(r["driver_phone"]),
    addonNames: (r["addon_names"] as string[] | null) ?? [],
    cancellationReason: str(r["cancellation_reason"]),
    cancelledAt: str(r["cancelled_at"]),
    createdAt: String(r["created_at"]),
  }));
}

export async function customerListSubscriptions(): Promise<CustomerSubscription[]> {
  const { data, error } = await supabase.rpc("customer_list_subscriptions");
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r["id"]),
    code: String(r["subscription_code"] ?? ""),
    status: r["status"] as CustomerSubscription["status"],
    startsAt: str(r["starts_at"]),
    endsAt: str(r["ends_at"]),
    expectedTotalUsd: num(r["expected_total_usd"]),
    creditsRemaining: num(r["ride_credits_remaining"]),
    ridesDiscounted: num(r["rides_discounted_count"]),
    planName: str(r["plan_name"]),
    planNameEn: str(r["plan_name_en"]),
    tier: str(r["tier"]),
    duration: str(r["duration"]),
    discountPercent: num(r["discount_percent"]),
    freeRideCredits: num(r["free_ride_credits"]),
    prioritySupport: r["priority_support"] === true,
    guaranteedSeat: r["guaranteed_seat"] === true,
    createdAt: String(r["created_at"]),
  }));
}

export async function customerListPayments(limit = 50): Promise<CustomerPayment[]> {
  const { data, error } = await supabase.rpc("customer_list_payments", { p_limit: limit });
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    kind: r["kind"] as CustomerPayment["kind"],
    referenceCode: String(r["reference_code"] ?? ""),
    method: str(r["method"]),
    amountUsd: Number(r["amount_usd"] ?? 0),
    reviewStatus: r["review_status"] as CustomerPayment["reviewStatus"],
    referenceNumber: str(r["reference_number"]),
    createdAt: String(r["created_at"]),
  }));
}

export async function customerGetProfile(): Promise<CustomerProfile> {
  const { data, error } = await supabase.rpc("customer_get_profile");
  if (error) fail(error);
  const d = (data ?? {}) as Row;
  return {
    email: str(d["email"]),
    fullName: str(d["full_name"]),
    phoneNumber: str(d["phone_number"]),
    preferredLanguage: d["preferred_language"] === "en" ? "en" : "ar",
    marketingOptIn: d["marketing_opt_in"] === true,
  };
}

export async function customerUpdateProfile(input: {
  fullName: string;
  phoneNumber: string;
  preferredLanguage: "ar" | "en";
  marketingOptIn: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc("customer_update_profile", {
    p_full_name: input.fullName,
    p_phone_number: input.phoneNumber,
    p_preferred_language: input.preferredLanguage,
    p_marketing_opt_in: input.marketingOptIn,
  });
  if (error) fail(error);
}

export async function customerListPassengers(): Promise<SavedPassenger[]> {
  const { data, error } = await supabase.rpc("customer_list_passengers");
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r["id"]),
    fullName: String(r["full_name"]),
    phoneNumber: str(r["phone_number"]),
    relation: str(r["relation"]),
  }));
}

export async function customerSavePassenger(input: {
  id?: string | null;
  fullName: string;
  phoneNumber: string;
  relation: string;
}): Promise<void> {
  const { error } = await supabase.rpc("customer_save_passenger", {
    p_id: input.id ?? null,
    p_full_name: input.fullName,
    p_phone_number: input.phoneNumber,
    p_relation: input.relation,
  });
  if (error) fail(error);
}

export async function customerDeletePassenger(id: string): Promise<void> {
  const { error } = await supabase.rpc("customer_delete_passenger", { p_id: id });
  if (error) fail(error);
}

export async function customerListNotifications(
  limit = 30,
  offset = 0,
): Promise<CustomerNotification[]> {
  const { data, error } = await supabase.rpc("customer_list_notifications", {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) fail(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r["id"]),
    type: String(r["type"]),
    data: (r["data"] as Record<string, unknown>) ?? {},
    linkPath: str(r["link_path"]),
    createdAt: String(r["created_at"]),
    isRead: r["is_read"] === true,
  }));
}

export async function customerMarkNotificationsRead(ids?: string[]): Promise<void> {
  const { error } = await supabase.rpc("customer_mark_notifications_read", { p_ids: ids ?? null });
  if (error) fail(error);
}

export async function customerDeleteAccount(): Promise<void> {
  const { error } = await supabase.rpc("customer_delete_account");
  if (error) fail(error);
  await supabase.auth.signOut();
}

/* -------------------------------------------------------------------------------------------------
 * Auth helpers (email code / password / Google)
 * ------------------------------------------------------------------------------------------------- */

function redirectOption(key: "emailRedirectTo"): { emailRedirectTo?: string };
function redirectOption(key: "redirectTo"): { redirectTo?: string };
function redirectOption(key: "emailRedirectTo" | "redirectTo"): Record<string, string> {
  return typeof window === "undefined" ? {} : { [key]: `${window.location.origin}/account` };
}

export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true, ...redirectOption("emailRedirectTo") },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Returns true when the account is created AND signed in; false when email confirmation is required first. */
export async function signUpWithPassword(
  email: string,
  password: string,
  fullName: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { ...redirectOption("emailRedirectTo"), data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
  return Boolean(data.session);
}

export async function verifySignupCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "signup",
  });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { ...redirectOption("redirectTo") },
  });
  if (error) throw error;
}

export async function updateOwnPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function customerSignOut(): Promise<void> {
  await supabase.auth.signOut();
}
