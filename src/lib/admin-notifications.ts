import { supabase } from "./supabase";

export type AdminNotificationSeverity = "info" | "warning" | "urgent";

export type AdminNotification = {
  id: string;
  type: string;
  severity: AdminNotificationSeverity;
  title: string;
  body: string | null;
  /** Admin route to open when the notification is clicked, e.g. "/admin/requests". */
  linkPath: string | null;
  createdAt: string;
  isRead: boolean;
};

export type AdminNotificationSummary = {
  unreadCount: number;
  urgentUnreadCount: number;
};

const AUTH_ERROR = "رمز الدخول غير صحيح أو الحساب غير مفعّل";

function rpcError(error: { message?: string }): never {
  throw new Error(
    error.message?.includes("رمز الدخول")
      ? AUTH_ERROR
      : error.message || "حصل خطأ مؤقت. حاول تاني.",
  );
}

function normalizeSeverity(value: unknown): AdminNotificationSeverity {
  return value === "urgent" || value === "warning" ? value : "info";
}

export async function adminGetNotificationSummary(
  token: string,
): Promise<AdminNotificationSummary> {
  const { data, error } = await supabase.rpc("admin_get_notification_summary", {
    p_access_token: token,
  });
  if (error) rpcError(error);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    unreadCount: Number(row["unread_count"] ?? 0),
    urgentUnreadCount: Number(row["urgent_unread_count"] ?? 0),
  };
}

export async function adminListNotifications(
  token: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
): Promise<AdminNotification[]> {
  const { data, error } = await supabase.rpc("admin_list_notifications", {
    p_access_token: token,
    p_limit: options.limit ?? 30,
    p_offset: options.offset ?? 0,
    p_unread_only: options.unreadOnly ?? false,
  });
  if (error) rpcError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r["id"]),
    type: String(r["type"] ?? ""),
    severity: normalizeSeverity(r["severity"]),
    title: String(r["title"] ?? ""),
    body: (r["body"] as string | null) ?? null,
    linkPath: (r["link_path"] as string | null) ?? null,
    createdAt: String(r["created_at"] ?? ""),
    isRead: r["is_read"] === true,
  }));
}

/** Pass `ids` to mark specific rows; omit it to mark everything visible to this staff member. */
export async function adminMarkNotificationsRead(token: string, ids?: string[]): Promise<number> {
  const { data, error } = await supabase.rpc("admin_mark_notifications_read", {
    p_access_token: token,
    p_ids: ids ?? null,
  });
  if (error) rpcError(error);
  return Number(data ?? 0);
}

/** "قبل 5 دقايق" style relative time, Egyptian Arabic. */
export function timeAgoAr(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "دلوقتي";
  const m = Math.floor(s / 60);
  if (m < 60)
    return m === 1
      ? "من دقيقة"
      : m === 2
        ? "من دقيقتين"
        : m <= 10
          ? `من ${m} دقايق`
          : `من ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24)
    return h === 1 ? "من ساعة" : h === 2 ? "من ساعتين" : h <= 10 ? `من ${h} ساعات` : `من ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30)
    return d === 1 ? "من يوم" : d === 2 ? "من يومين" : d <= 10 ? `من ${d} أيام` : `من ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

/** Icon key + label per notification type, used by the bell and the full page. */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  booking_new: "حجز جديد",
  booking_cancelled: "حجز ملغي",
  payment_review: "مراجعة دفعة",
  payment_stale: "دفعة متأخرة",
  subscription_payment_review: "دفعة اشتراك",
  custom_request: "طلب رحلة مخصصة",
  contact_message: "رسالة تواصل",
  rental_application: "طلب تأجير",
  rental_vehicle: "عربية تأجير",
  low_rating: "تقييم منخفض",
  gh_incident: "بلاغ تشغيل أرضي",
  departure_below_minimum: "تحت الحد الأدنى",
  unassigned_soon: "بدون سائق",
};
