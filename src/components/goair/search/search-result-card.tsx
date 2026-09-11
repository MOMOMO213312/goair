import { Link } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, CalendarX2, Info, MapPin, Sparkle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScheduleOption, Trip, VehicleType } from "@/lib/goair";
import { formatTime, formatUsd, isGeneratedScheduleId } from "@/lib/goair";
import { useDestinationPhoto } from "@/hooks/use-destination-photo";
import {
  getDedicatedRouteImage,
  getTripCityLocation,
  getTripRouteImage,
} from "@/lib/trip-media";
import { cn } from "@/lib/utils";
import { getCountryLabel } from "@/lib/i18n/country-labels";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";

export function isFallbackSchedule(scheduleId: string) {
  return isGeneratedScheduleId(scheduleId);
}

type SearchResultCardProps = {
  trip: Trip;
  /** Every departure time available for this one route — the customer picks ONE via a single dropdown, never a list of rows. */
  options: ScheduleOption[];
  seats: number;
  travelDate: string;
  className?: string;
  /** Group-size tier per departure — used only for capacity/luggage info, never shown as a vehicle name. */
  vehicleTypesById?: Map<string, VehicleType>;
  /** Carried over from the hero search — prefills the booking form, nothing more (no live tracking yet). */
  flight?: string | undefined;
};

function RouteImage({
  image,
  cityLabel,
  className,
}: {
  image: string | null;
  cityLabel: string;
  className?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        width={256}
        height={160}
        loading="lazy"
        className={cn("object-cover", className)}
      />
    );
  }

  return <DestinationPlaceholder destination={cityLabel} className={className} />;
}

export function SearchResultCard({
  trip,
  options,
  seats,
  travelDate,
  className,
  vehicleTypesById,
  flight,
}: SearchResultCardProps) {
  const { t, language } = useTranslation();
  const originLabel = localize(trip.origin, trip.origin_en, language);
  const destLabel = localize(trip.destination, trip.destination_en, language);
  const cityLabel = getTripCityLocation(trip);
  const dedicatedImage = getDedicatedRouteImage(trip);
  const poolFallback = getTripRouteImage(trip);
  const image = useDestinationPhoto(trip.country, cityLabel, dedicatedImage, poolFallback);
  const hasFallback = options.some((option) => isFallbackSchedule(option.scheduleId));
  const maxLuggage = options.reduce<number | null>((max, option) => {
    const vehicle = option.vehicleTypeId ? vehicleTypesById?.get(option.vehicleTypeId) : null;
    if (vehicle?.maxLuggage == null) return max;
    return max === null ? vehicle.maxLuggage : Math.max(max, vehicle.maxLuggage);
  }, null);

  // The trip may run at many points across the day, but the customer never
  // sees "16 available departures" as a stacked list — just one compact
  // "pick your time" control, same as picking a pickup time on any transfer
  // site. Default to the earliest still-available slot.
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);

  const defaultScheduleId = useMemo(
    () => (options.find((option) => option.isAvailable) ?? options[0])?.scheduleId,
    [options],
  );

  useEffect(() => {
    setSelectedScheduleId(defaultScheduleId);
  }, [defaultScheduleId]);

  const selectedOption =
    options.find((option) => option.scheduleId === selectedScheduleId) ??
    options.find((option) => option.isAvailable) ??
    options[0];

  const notEnough =
    selectedOption && !isFallbackSchedule(selectedOption.scheduleId)
      ? selectedOption.remainingSeats !== null && selectedOption.remainingSeats < seats
      : false;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] sm:flex-row",
        className,
      )}
    >
      {/* Photo — fixed-width column with a badge overlay, same treatment as
          the private-booking cards, instead of a tall strip stretched to
          match the content column's height. */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48 md:w-56">
        <RouteImage image={image} cityLabel={cityLabel} className="size-full" />
        <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
          {trip.airport_code}
        </span>
      </div>

      {/* Details — the middle column. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-extrabold leading-snug text-primary sm:text-lg">
            {originLabel}
            <ArrowLeft className="mx-1.5 inline size-4 text-accent" aria-hidden />
            {destLabel}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
            <Sparkle className="size-3" aria-hidden />
            {t("search.resultCard.shared")}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{getCountryLabel(trip.country, language)}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {maxLuggage != null ? (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Briefcase className="size-3.5 text-muted-foreground/70" aria-hidden />
              {t("search.resultCard.upToLuggage", { count: maxLuggage })}
            </span>
          ) : null}
          {trip.distance_km != null ? (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <MapPin className="size-3.5 text-muted-foreground/70" aria-hidden />
              {t("search.filters.distanceKm", { km: trip.distance_km })}
            </span>
          ) : null}
        </div>

        {/* Route visual — horizontal on md+, kept as its own row since it
            needs more width than the perk chips above. */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{t("search.resultCard.airport")}</p>
            <p className="mt-1 font-display text-sm font-bold text-primary">{trip.airport_code}</p>
          </div>
          <div className="relative min-w-0 flex-1 px-2">
            <FlightPath className="h-8 w-full text-accent/50" />
          </div>
          <div className="max-w-[8rem] text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{t("search.resultCard.destination")}</p>
            <p className="mt-1 truncate font-display text-sm font-bold text-primary">{destLabel}</p>
          </div>
        </div>

        {/* Same trust perks as the private-booking cards, for a consistent promise across booking types */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarX2 className="size-3.5 text-accent" aria-hidden />
            {t("search.resultCard.freeCancellation")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5 text-accent" aria-hidden />
            {t("search.resultCard.namedPickup")}
          </span>
        </div>

        {/* Single time picker — not a row per departure */}
        <div className="border-t border-border pt-3">
          <Label className="text-xs font-bold text-primary">{t("search.resultCard.pickTime")}</Label>
          <Select value={selectedScheduleId ?? ""} onValueChange={setSelectedScheduleId}>
            <SelectTrigger className="mt-1.5 bg-card">
              <SelectValue placeholder={t("search.resultCard.pickTimePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.scheduleId} value={option.scheduleId} disabled={!option.isAvailable}>
                  {formatTime(option.departureTime) || option.departureTime.slice(0, 5)}
                  {!option.isAvailable ? t("search.resultCard.full") : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {notEnough ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-destructive">
              <Info className="size-3 shrink-0" aria-hidden />
              {t("search.resultCard.notEnoughSeats")}
            </p>
          ) : hasFallback ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="size-3 shrink-0" aria-hidden />
              {t("search.resultCard.seatConfirmedOnBooking")}
            </p>
          ) : null}
        </div>
      </div>

      {/* Price + CTA — its own column on desktop, divided from the details
          by a border, matching the private-booking layout so price and the
          booking action are the first thing the eye lands on. */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-t border-border p-5 text-center sm:w-52 sm:border-t-0 sm:border-s sm:border-border">
        <PriceBlock
          pricePerSeat={selectedOption?.pricePerSeat ?? 0}
          total={(selectedOption?.pricePerSeat ?? 0) * seats}
          seats={seats}
        />
        <BookButton
          trip={trip}
          option={selectedOption}
          seats={seats}
          travelDate={travelDate}
          disabled={!selectedOption || notEnough}
          flight={flight}
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
}

function PriceBlock({
  pricePerSeat,
  total,
  seats,
}: {
  pricePerSeat: number;
  total: number;
  seats: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <span className="text-xs font-bold text-muted-foreground">
        {formatUsd(pricePerSeat)} {t("search.resultCard.perSeat")}
        {seats > 1 ? t("search.resultCard.seatsCount", { count: seats }) : ""}
      </span>
      <p className="font-display text-2xl font-extrabold text-accent">{formatUsd(total)}</p>
    </div>
  );
}

function BookButton({
  trip,
  option,
  seats,
  travelDate,
  disabled,
  flight,
  className,
}: {
  trip: Trip;
  option: ScheduleOption | undefined;
  seats: number;
  travelDate: string;
  disabled: boolean;
  flight?: string | undefined;
  className?: string | undefined;
}) {
  const { t } = useTranslation();
  if (disabled || !option) {
    return (
      <Button disabled className={cn("h-11 font-bold", className)}>
        {t("search.resultCard.noSeatsAvailable")}
      </Button>
    );
  }

  return (
    <Button
      asChild
      className={cn("h-11 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90", className)}
    >
      <Link
        to="/book"
        search={{
          tripId: trip.id,
          scheduleId: option.scheduleId,
          tripOptionId: option.tripOptionId ?? "",
          date: travelDate,
          seats,
          time: option.departureTime,
          price: option.pricePerSeat,
          bookingType: "shared",
          ...(flight ? { flight } : {}),
        }}
      >
        {t("search.resultCard.bookNow")}
      </Link>
    </Button>
  );
}
