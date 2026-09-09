import { Copy } from "lucide-react";
import { toast } from "sonner";

import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { formatSearchDate } from "@/components/goair/search/search-summary";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingRecord, Trip } from "@/lib/goair";
import { formatTime, formatUsd } from "@/lib/goair";
import { useDestinationPhoto } from "@/hooks/use-destination-photo";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import {
  getDedicatedRouteImageFromTripOrFallback,
  getRouteImageFromTripOrFallback,
  getTripCityLocation,
} from "@/lib/trip-media";
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
  const { t, language } = useTranslation();
  const total = Number(booking.expected_total_usd ?? 0);
  const seats = Number(booking.seats_count ?? 1);
  const travelDate = bookingField(booking, ["travel_date"]);
  const departureRaw = extractDepartureTime(booking);

  const rawOrigin = trip?.airport_name ?? trip?.origin ?? bookingField(booking, ["origin", "airport_name"]);
  const rawDest = trip?.destination ?? bookingField(booking, ["destination"]);
  const originLabel = trip
    ? localize(rawOrigin, trip.airport_name_en ?? trip.origin_en, language)
    : rawOrigin;
  const destLabel = trip ? localize(rawDest, trip.destination_en, language) : rawDest;
  const airportCode = trip?.airport_code ?? bookingField(booking, ["airport_code"]);
  const country = trip?.country ?? bookingField(booking, ["country"]);
  const fallbackArgs = {
    origin: trip?.origin ?? bookingField(booking, ["origin"]),
    destination: destLabel,
    airport_name: trip?.airport_name ?? bookingField(booking, ["airport_name"]),
    airport_code: airportCode,
    country,
  };
  const poolFallback = getRouteImageFromTripOrFallback(trip, fallbackArgs);
  const dedicatedImage = getDedicatedRouteImageFromTripOrFallback(trip, fallbackArgs);
  const cityLabel = trip
    ? getTripCityLocation(trip)
    : destLabel;
  const image = useDestinationPhoto(country, cityLabel, dedicatedImage, poolFallback);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {image ? (
        <img
          src={image}
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
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("payment.bookingSummary.tripLabel")}</p>

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
              <dt className="text-muted-foreground">{t("payment.bookingSummary.date")}</dt>
              <dd className="font-bold text-primary">{formatSearchDate(travelDate)}</dd>
            </div>
          ) : null}
          {departureRaw ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("payment.bookingSummary.departureTime")}</dt>
              <dd className="font-bold text-primary">
                {formatTime(departureRaw) || departureRaw}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("payment.bookingSummary.seats")}</dt>
            <dd className="font-bold text-primary">
              {seats} {seats === 1 ? t("payment.bookingSummary.seatSingular") : t("payment.bookingSummary.seatPlural")}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-secondary/50 px-4 py-3">
          <p className="text-xs font-bold text-muted-foreground">{t("payment.bookingSummary.amountDue")}</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-accent">{formatUsd(total)}</p>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground">{t("payment.bookingSummary.ticketCode")}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-lg font-extrabold tracking-widest text-primary">
              {ticket}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("payment.bookingSummary.copyAria")}
              onClick={() => {
                void navigator.clipboard.writeText(ticket);
                toast.success(t("payment.bookingSummary.copiedToast"));
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
