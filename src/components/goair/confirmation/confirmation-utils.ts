import type { BookingRecord } from "@/lib/goair";

export function bookingField(booking: BookingRecord | undefined, keys: string[]): string {
  if (!booking) return "";
  for (const key of keys) {
    const value = booking[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

export function extractDepartureTime(booking: BookingRecord | undefined): string {
  const datetime = bookingField(booking, ["travel_datetime", "departure_time"]);
  if (!datetime) return "";
  if (datetime.includes("T")) return datetime.split("T")[1]?.slice(0, 5) ?? "";
  return datetime.slice(0, 5);
}

export type BookingStatusKey = "confirmed" | "pending" | "cancelled" | "unknown";

export function normalizeBookingStatus(booking: BookingRecord | undefined): BookingStatusKey {
  const raw = bookingField(booking, ["status"]).toLowerCase();
  if (raw.includes("confirm") || raw === "مؤكد") return "confirmed";
  if (raw.includes("cancel") || raw === "ملغي") return "cancelled";
  if (raw.includes("pending") || raw.includes("review") || raw === "قيد المراجعة") return "pending";
  if (!raw) return "pending";
  return "unknown";
}

export const STATUS_LABELS: Record<BookingStatusKey, string> = {
  confirmed: "مؤكد",
  pending: "قيد المراجعة",
  cancelled: "ملغي",
  unknown: "قيد المعالجة",
};

export const SUCCESS_COPY: Record<
  BookingStatusKey,
  { title: string; subtitle: string; successLine: string }
> = {
  confirmed: {
    title: "تم تأكيد حجزك",
    subtitle: "رحلتك مع GoAir جاهزة",
    successLine: "تم الحجز بنجاح",
  },
  pending: {
    title: "تم استلام حجزك",
    subtitle: "فريق GoAir يراجع بيانات الدفع",
    successLine: "تم إرسال الحجز بنجاح",
  },
  cancelled: {
    title: "الحجز ملغي",
    subtitle: "هذا الحجز لم يعد نشطًا",
    successLine: "الحجز غير متاح",
  },
  unknown: {
    title: "تم استلام حجزك",
    subtitle: "رحلتك مع GoAir قيد المعالجة",
    successLine: "تم إرسال الحجز بنجاح",
  },
};
