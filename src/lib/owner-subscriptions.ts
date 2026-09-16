import { supabase } from "./supabase";

/**
 * Annual subscription system for individual car owners — both private-car
 * transport providers (`transport_operator`, `accepts_shared_bookings =
 * false`) and individual rental-vehicle owners (`rental_partner`,
 * `provider_type = "individual"`). Optional: an owner can operate without
 * ever subscribing, just on worse default terms (see README/runbook for the
 * full rationale — this mirrors the existing operator payout / rental
 * platform_commission_rate mechanisms, it does not replace them).
 *
 * All RPC names here match 1:1 with the functions created in the
 * `create_owner_subscription_system` / `owner_subscription_rpcs` /
 * `seed_initial_owner_subscription_plans` migrations.
 */

function rpcError(error: { message?: string }): never {
  throw new Error(
    error.message?.includes("رمز الدخول")
      ? "رمز الدخول غير صحيح أو الحساب غير مفعّل"
      : error.message || "حصل خطأ.",
  );
}

export type SubscriberType = "transport_operator" | "rental_partner";
export type ProviderType = "transport" | "rental";
export type SubscriptionTier = "bronze" | "silver" | "gold";
export type SubscriptionStatus =
  "pending_payment" | "active" | "expired" | "cancelled" | "rejected";

export type OwnerSubscriptionPlan = {
  id: string;
  providerType: ProviderType;
  tier: SubscriptionTier;
  nameAr: string;
  nameEn: string;
  priceUsd: number;
  durationMonths: number;
  /** Only set when providerType === "transport". */
  transportPayoutBonusPercent: number | null;
  /** Only set when providerType === "rental". */
  rentalCommissionRate: number | null;
  priorityWeight: number;
  isFeatured: boolean;
};

export type OwnerSubscription = {
  id: string;
  planId: string;
  subscriberType: SubscriberType;
  status: SubscriptionStatus;
  startsAt: string | null;
  endsAt: string | null;
  amountPaidUsd: number | null;
  proofOfPaymentUrl: string | null;
  adminNotes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  plan: OwnerSubscriptionPlan;
};

function mapPlan(row: Record<string, unknown>): OwnerSubscriptionPlan {
  return {
    id: row["id"] as string,
    providerType: row["provider_type"] as ProviderType,
    tier: row["tier"] as SubscriptionTier,
    nameAr: row["name_ar"] as string,
    nameEn: row["name_en"] as string,
    priceUsd: Number(row["price_usd"]),
    durationMonths: Number(row["duration_months"]),
    transportPayoutBonusPercent:
      row["transport_payout_bonus_percent"] != null
        ? Number(row["transport_payout_bonus_percent"])
        : null,
    rentalCommissionRate:
      row["rental_commission_rate"] != null ? Number(row["rental_commission_rate"]) : null,
    priorityWeight: Number(row["priority_weight"]),
    isFeatured: Boolean(row["is_featured"]),
  };
}

function mapSubscription(
  subscriptionRow: Record<string, unknown>,
  planRow: Record<string, unknown>,
): OwnerSubscription {
  return {
    id: subscriptionRow["id"] as string,
    planId: subscriptionRow["plan_id"] as string,
    subscriberType: subscriptionRow["subscriber_type"] as SubscriberType,
    status: subscriptionRow["status"] as SubscriptionStatus,
    startsAt: (subscriptionRow["starts_at"] as string | null) ?? null,
    endsAt: (subscriptionRow["ends_at"] as string | null) ?? null,
    amountPaidUsd:
      subscriptionRow["amount_paid_usd"] != null
        ? Number(subscriptionRow["amount_paid_usd"])
        : null,
    proofOfPaymentUrl: (subscriptionRow["proof_of_payment_url"] as string | null) ?? null,
    adminNotes: (subscriptionRow["admin_notes"] as string | null) ?? null,
    createdAt: subscriptionRow["created_at"] as string,
    confirmedAt: (subscriptionRow["confirmed_at"] as string | null) ?? null,
    plan: mapPlan(planRow),
  };
}

/** Public — no login needed. Shows the catalog before an owner decides to join. */
export async function getOwnerSubscriptionPlans(
  providerType: ProviderType,
): Promise<OwnerSubscriptionPlan[]> {
  const { data, error } = await supabase.rpc("get_owner_subscription_plans", {
    p_provider_type: providerType,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapPlan);
}

/** Owner sends a subscription request with proof of payment (same pattern as booking proof-of-payment elsewhere). */
export async function requestOwnerSubscription(
  token: string,
  subscriberType: SubscriberType,
  planId: string,
  proofOfPaymentUrl: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("request_owner_subscription", {
    p_token: token,
    p_subscriber_type: subscriberType,
    p_plan_id: planId,
    p_proof_of_payment_url: proofOfPaymentUrl,
  });
  if (error) rpcError(error);
}

/** Owner's own subscription status/history — shown on their dashboard. */
export async function getMyOwnerSubscriptions(
  token: string,
  subscriberType: SubscriberType,
): Promise<OwnerSubscription[]> {
  const { data, error } = await supabase.rpc("my_owner_subscriptions", {
    p_token: token,
    p_subscriber_type: subscriberType,
  });
  if (error) rpcError(error);
  return (
    (data ?? []) as { subscription: Record<string, unknown>; plan: Record<string, unknown> }[]
  ).map((row) => mapSubscription(row["subscription"], row["plan"]));
}

// ---- Admin (super_admin / finance only — see staff_has_role in the RPCs) ----

export type AdminOwnerSubscriptionRow = OwnerSubscription & { subscriberId: string };

export async function adminListOwnerSubscriptions(
  adminToken: string,
  status?: SubscriptionStatus,
): Promise<AdminOwnerSubscriptionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_owner_subscriptions", {
    p_access_token: adminToken,
    p_status: status ?? null,
  });
  if (error) rpcError(error);
  return (
    (data ?? []) as { subscription: Record<string, unknown>; plan: Record<string, unknown> }[]
  ).map((row) => ({
    ...mapSubscription(row["subscription"], row["plan"]),
    subscriberId: row["subscription"]["subscriber_id"] as string,
  }));
}

export async function adminConfirmOwnerSubscription(
  adminToken: string,
  subscriptionId: string,
): Promise<void> {
  const { error } = await supabase.rpc("admin_confirm_owner_subscription", {
    p_access_token: adminToken,
    p_subscription_id: subscriptionId,
  });
  if (error) rpcError(error);
}

export async function adminRejectOwnerSubscription(
  adminToken: string,
  subscriptionId: string,
  notes: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_reject_owner_subscription", {
    p_access_token: adminToken,
    p_subscription_id: subscriptionId,
    p_notes: notes,
  });
  if (error) rpcError(error);
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending_payment: "بانتظار مراجعة الدفع",
  active: "فعّال",
  expired: "منتهي",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  bronze: "برونزي",
  silver: "فضي",
  gold: "ذهبي",
};
