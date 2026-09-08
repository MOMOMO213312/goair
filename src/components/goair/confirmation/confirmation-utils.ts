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

// Status label / success copy text now lives in the i18n translation files
// (confirmation.statusLabels / confirmation.successCopy) — look them up via
// useTranslation()'s t() with the BookingStatusKey as the last path segment.
