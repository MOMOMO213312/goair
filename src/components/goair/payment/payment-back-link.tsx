import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { BookingRecord } from "@/lib/goair";
import { cn } from "@/lib/utils";

function bookingField(booking: BookingRecord, keys: string[]): string {
  for (const key of keys) {
    const value = booking[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

function extractDepartureTime(booking: BookingRecord): string {
  const datetime = bookingField(booking, ["travel_datetime", "departure_time"]);
  if (!datetime) return "";
  if (datetime.includes("T")) return datetime.split("T")[1]?.slice(0, 5) ?? "";
  return datetime.slice(0, 5);
}

function pricePerSeat(booking: BookingRecord): number {
  const total = Number(booking.expected_total_usd ?? 0);
  const seats = Math.max(1, Number(booking.seats_count ?? 1));
  return total / seats;
}

type PaymentBackLinkProps = {
  booking: BookingRecord;
  className?: string;
};

export function PaymentBackLink({ booking, className }: PaymentBackLinkProps) {
  const tripId = bookingField(booking, ["trip_id"]);
  const scheduleId = bookingField(booking, ["schedule_id"]);
  const tripOptionId = bookingField(booking, ["trip_option_id"]);
  const date = bookingField(booking, ["travel_date"]);
  const seats = Math.max(1, Number(booking.seats_count ?? 1));
  const time = extractDepartureTime(booking);
  const price = pricePerSeat(booking);

  if (!tripId || !scheduleId || !date) {
    return (
      <Link
        to="/"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary",
          className,
        )}
      >
        <ArrowRight className="size-4" aria-hidden />
        العودة لبيانات الحجز
      </Link>
    );
  }

  return (
    <Link
      to="/book"
      search={{
        tripId,
        scheduleId,
        tripOptionId,
        date,
        seats,
        time,
        price,
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <ArrowRight className="size-4" aria-hidden />
      العودة لبيانات الحجز
    </Link>
  );
}
