import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarX2, Clock, Info, MapPin, UserRound, Zap } from "lucide-react";

import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ScheduleOption, Trip, VehicleType } from "@/lib/goair";
import { formatTime, formatUsd, isGeneratedScheduleId } from "@/lib/goair";
import { getTripCityLocation, getTripRouteImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

export function isFallbackSchedule(scheduleId: string) {
  return isGeneratedScheduleId(scheduleId);
}

type SearchResultCardProps = {
  trip: Trip;
  /** Every departure time available for this one route — rendered as rows in a single card. */
  options: ScheduleOption[];
  seats: number;
  travelDate: string;
  packageId?: string;
  className?: string;
  /** Group-size tier per departure — used only for capacity/luggage info, never shown as a vehicle name. */
  vehicleTypesById?: Map<string, VehicleType>;
  /** Price of the cheapest departure across the whole search — shown as a badge on the matching row. */
  cheapestPrice?: number | null;
  /** Time of the earliest departure across the whole search — shown as a badge on the matching row. */
  earliestTime?: string | null;
  /** Carried over from the hero search — prefills the booking form, nothing more (no live tracking yet). */
  flight?: string;
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
  packageId,
  className,
  vehicleTypesById,
  cheapestPrice = null,
  earliestTime = null,
  flight,
}: SearchResultCardProps) {
  const cityLabel = getTripCityLocation(trip);
  const image = getTripRouteImage(trip);
  const hasFallback = options.some((option) => isFallbackSchedule(option.scheduleId));
  const maxLuggage = options.reduce<number | null>((max, option) => {
    const vehicle = option.vehicleTypeId ? vehicleTypesById?.get(option.vehicleTypeId) : null;
    if (vehicle?.maxLuggage == null) return max;
    return max === null ? vehicle.maxLuggage : Math.max(max, vehicle.maxLuggage);
  }, null);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      {/* Mobile: compact top image */}
      <RouteImage image={image} cityLabel={cityLabel} className="h-20 w-full md:hidden" />

      <div className="flex flex-col md:flex-row">
        {/* Side: image desktop */}
        <div className="hidden border-l border-border md:block md:w-56 lg:w-64">
          <RouteImage image={image} cityLabel={cityLabel} className="h-full w-full" />
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          {/* Route header — shown once for every departure below */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-primary">
                  {trip.airport_code}
                </span>
                <span>{trip.country}</span>
                {hasFallback ? (
                  <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium">
                    مواعيد مرجعية
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 font-display text-lg font-extrabold leading-snug text-primary sm:text-xl">
                {trip.origin}
                <ArrowLeft className="mx-1.5 inline size-4 text-accent" aria-hidden />
                {trip.destination}
              </h3>
            </div>
          </div>

          {/* Route visual — horizontal on md+ */}
          <div className="mt-4 hidden items-center gap-3 md:flex">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">المطار</p>
              <p className="mt-1 font-display text-sm font-bold text-primary">{trip.airport_code}</p>
            </div>
            <div className="relative min-w-0 flex-1 px-2">
              <FlightPath className="h-8 w-full text-accent/50" />
            </div>
            <div className="max-w-[8rem] text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">الوجهة</p>
              <p className="mt-1 truncate font-display text-sm font-bold text-primary">
                {trip.destination}
              </p>
            </div>
          </div>

          {/* Details row — shown once */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <UserRound className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground">نوع الرحلة</p>
                <p className="font-display text-base font-extrabold text-primary">نقل مشترك</p>
              </div>
            </div>

            {maxLuggage != null ? (
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Briefcase className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground">الحقائب</p>
                  <p className="font-display text-base font-extrabold text-primary">
                    حتى {maxLuggage} حقيبة
                  </p>
                </div>
              </div>
            ) : null}

            {trip.distance_km != null ? (
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground">المسافة</p>
                  <p className="font-display text-base font-bold text-primary">
                    {trip.distance_km} كم
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Included perks — shown once */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarX2 className="size-3.5 text-accent" aria-hidden />
              إلغاء مجاني حتى 24 ساعة
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5 text-accent" aria-hidden />
              استقبال بلافتة باسمك
            </span>
          </div>

          {/* One row per available departure time */}
          <div className="mt-4 divide-y divide-border border-t border-border">
            {options.map((option) => (
              <ScheduleRow
                key={option.scheduleId}
                trip={trip}
                option={option}
                seats={seats}
                travelDate={travelDate}
                packageId={packageId}
                flight={flight}
                isBestPrice={options.length > 1 && cheapestPrice !== null && option.pricePerSeat === cheapestPrice}
                isFastest={
                  options.length > 1 &&
                  earliestTime !== null &&
                  option.departureTime === earliestTime &&
                  option.pricePerSeat !== cheapestPrice
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ScheduleRow({
  trip,
  option,
  seats,
  travelDate,
  packageId,
  flight,
  isBestPrice,
  isFastest,
}: {
  trip: Trip;
  option: ScheduleOption;
  seats: number;
  travelDate: string;
  packageId?: string;
  flight?: string;
  isBestPrice: boolean;
  isFastest: boolean;
}) {
  const fallback = isFallbackSchedule(option.scheduleId);
  const total = option.pricePerSeat * seats;
  const notEnough = !fallback && option.remainingSeats !== null && option.remainingSeats < seats;

  const seatMessage = fallback
    ? "يُؤكَّد توفر المقعد عند إتمام الحجز"
    : option.remainingSeats === null
      ? "يُؤكَّد توفر المقعد عند إتمام الحجز"
      : `${option.remainingSeats} مقعد متبقي`;

  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Clock className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-extrabold text-primary">
              {formatTime(option.departureTime) || option.departureTime.slice(0, 5)}
            </p>
            {isBestPrice ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                <BadgeCheck className="size-3" aria-hidden />
                أفضل سعر
              </span>
            ) : null}
            {isFastest ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Zap className="size-3" aria-hidden />
                الأسرع
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="size-3 shrink-0" aria-hidden />
            {seatMessage}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <PriceBlock pricePerSeat={option.pricePerSeat} total={total} seats={seats} />
        <BookButton
          trip={trip}
          option={option}
          seats={seats}
          travelDate={travelDate}
          disabled={notEnough}
          packageId={packageId}
          flight={flight}
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
  return (
    <div className="text-left sm:text-right">
      <p className="text-xs text-muted-foreground">
        {formatUsd(pricePerSeat)} للمقعد
        {seats > 1 ? ` · ${seats} مقاعد` : ""}
      </p>
      <p className="font-display text-xl font-extrabold text-accent sm:text-2xl">
        {formatUsd(total)}
      </p>
    </div>
  );
}

function BookButton({
  trip,
  option,
  seats,
  travelDate,
  disabled,
  packageId,
  flight,
  className,
}: {
  trip: Trip;
  option: ScheduleOption;
  seats: number;
  travelDate: string;
  disabled: boolean;
  packageId?: string;
  flight?: string;
  className?: string;
}) {
  if (disabled) {
    return (
      <Button disabled className={cn("h-11 shrink-0 font-bold", className)}>
        لا توجد مقاعد كافية
      </Button>
    );
  }

  return (
    <Button
      asChild
      className={cn(
        "h-11 shrink-0 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90",
        className,
      )}
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
          ...(packageId ? { packageId } : {}),
          ...(flight ? { flight } : {}),
        }}
      >
        احجز الآن
      </Link>
    </Button>
  );
}
