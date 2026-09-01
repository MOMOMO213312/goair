import { Copy } from "lucide-react";
import { toast } from "sonner";

import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { formatSearchDate } from "@/components/goair/search/search-summary";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDestinationPhoto } from "@/hooks/use-destination-photo";
import type { BookingRecord, Trip } from "@/lib/goair";
import { formatTime, formatUsd } from "@/lib/goair";
import { getRouteImageFromTripOrFallback, getTripCityLocation } from "@/lib/trip-media";
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

type PaymentBookingSummaryProps = {
  booking: BookingRecord;
  trip: Trip | undefined;
  ticket: string;
  className?: string;
};

export function PaymentBookingSummary({
  booking,
  trip,
  ticket,
  className,
}: PaymentBookingSummaryProps) {
  const total = Number(booking.expected_total_usd ?? 0);
  const seats = Number(booking.seats_count ?? 1);
  const travelDate = bookingField(booking, ["travel_date"]);
  const departureRaw = extractDepartureTime(booking);

  const originLabel = trip?.airport_name ?? trip?.origin ?? bookingField(booking, ["origin", "airport_name"]);
  const destLabel = trip?.destination ?? bookingField(booking, ["destination"]);
  const airportCode = trip?.airport_code ?? bookingField(booking, ["airport_code"]);
  const country = trip?.country ?? bookingField(booking, ["country"]);
  const image = getRouteImageFromTripOrFallback(trip, {
    origin: trip?.origin ?? bookingField(booking, ["origin"]),
    destination: destLabel,
    airport_name: trip?.airport_name ?? bookingField(booking, ["airport_name"]),
    airport_code: airportCode,
    country,
  });
  const cityLabel = trip
    ? getTripCityLocation(trip)
    : destLabel;
  const resolvedImage = useDestinationPhoto(image, cityLabel, country);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {resolvedImage ? (
        <img
          src={resolvedImage}
          alt=""
          width={400}
          height={100}
          loading="lazy"
          className="h-20 w-full object-cover sm:h-24"
        />
      ) : cityLabel ? (
        <DestinationPlaceholder destination={cityLabel} className="h-20 sm:h-24" />
      ) : null}

      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">رحلتك</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-base font-extrabold text-primary">
            {originLabel || "—"}
          </span>
          {airportCode ? (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
              {airportCode}
            </span>
          ) : null}
          <span className="text-accent" aria-hidden>
            →
          </span>
          <span className="font-display text-base font-extrabold text-primary">
            {destLabel || "—"}
          </span>
        </div>

        <div className="mt-3">
          <FlightPath className="h-6 w-full text-accent/40" />
        </div>

        <dl className="mt-4 space-y-2.5 text-sm">
          {travelDate ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">التاريخ</dt>
              <dd className="font-bold text-primary">{formatSearchDate(travelDate)}</dd>
            </div>
          ) : null}
          {departureRaw ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">موعد المغادرة</dt>
              <dd className="font-bold text-primary">
                {formatTime(departureRaw) || departureRaw}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">المقاعد</dt>
            <dd className="font-bold text-primary">
              {seats} {seats === 1 ? "مقعد" : "مقاعد"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-secondary/50 px-4 py-3">
          <p className="text-xs font-bold text-muted-foreground">المبلغ المطلوب</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-accent">{formatUsd(total)}</p>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground">كود التذكرة</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-lg font-extrabold tracking-widest text-primary">
              {ticket}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="نسخ كود التذكرة"
              onClick={() => {
                void navigator.clipboard.writeText(ticket);
                toast.success("تم نسخ الكود.");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
