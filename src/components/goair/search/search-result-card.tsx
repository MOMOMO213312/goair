import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarX2, Clock, Info, MapPin, UserRound, Users } from "lucide-react";

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
  option: ScheduleOption;
  seats: number;
  travelDate: string;
  packageId?: string;
  className?: string;
  /** Group-size tier for this departure — used only for capacity/luggage info, never shown as a vehicle name. */
  vehicleType?: VehicleType | null;
  /** True when this is the cheapest available departure for the search — shown as a small badge. */
  isBestPrice?: boolean;
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
  option,
  seats,
  travelDate,
  packageId,
  className,
  vehicleType,
  isBestPrice,
  flight,
}: SearchResultCardProps) {
  const fallback = isFallbackSchedule(option.scheduleId);
  const total = option.pricePerSeat * seats;
  const cityLabel = getTripCityLocation(trip);
  const image = getTripRouteImage(trip);
  const notEnough =
    !fallback && option.remainingSeats !== null && option.remainingSeats < seats;

  const seatMessage = fallback
    ? "يُؤكَّد توفر المقعد عند إتمام الحجز"
    : option.remainingSeats === null
      ? "يُؤكَّد توفر المقعد عند إتمام الحجز"
      : `${option.remainingSeats} مقعد متبقي`;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      {/* Mobile: compact top image */}
      <RouteImage
        image={image}
        cityLabel={cityLabel}
        className="h-20 w-full md:hidden"
      />

      <div className="flex flex-col md:flex-row">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          {/* Route header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-primary">
                  {trip.airport_code}
                </span>
                <span>{trip.country}</span>
                {fallback ? (
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

            {isBestPrice ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                <BadgeCheck className="size-3.5" aria-hidden />
                أفضل سعر
              </span>
            ) : null}
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

          {/* Details row */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Users className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground">نوع الرحلة</p>
                <p className="font-display text-base font-extrabold text-primary">نقل مشترك</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Clock className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground">موعد المغادرة</p>
                <p className="font-display text-base font-extrabold text-primary">
                  {formatTime(option.departureTime) || option.departureTime.slice(0, 5)}
                </p>
              </div>
            </div>

            {vehicleType?.maxLuggage != null ? (
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Briefcase className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground">الحقائب</p>
                  <p className="font-display text-base font-extrabold text-primary">
                    حتى {vehicleType.maxLuggage} حقيبة
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

          {/* Included perks — same claims already made site-wide (hero trust strip) */}
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

          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {seatMessage}
          </p>

          {/* Price + CTA — mobile inline */}
          <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between md:hidden">
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

        {/* Side: image + price desktop */}
        <div className="hidden flex-col border-r border-border md:flex md:w-56 lg:w-64">
          <RouteImage
            image={image}
            cityLabel={cityLabel}
            className="h-28 w-full lg:h-32"
          />

          <div className="flex flex-1 flex-col justify-between p-4">
            <PriceBlock pricePerSeat={option.pricePerSeat} total={total} seats={seats} />
            <BookButton
              trip={trip}
              option={option}
              seats={seats}
              travelDate={travelDate}
              disabled={notEnough}
              packageId={packageId}
              flight={flight}
              className="mt-4 w-full"
            />
          </div>
        </div>
      </div>
    </Card>
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
    <div>
      <p className="text-xs text-muted-foreground">
        {formatUsd(pricePerSeat)} للمقعد
        {seats > 1 ? ` · ${seats} مقاعد` : ""}
      </p>
      <p className="font-display text-2xl font-extrabold text-accent sm:text-3xl">
        {formatUsd(total)}
      </p>
      {seats > 1 ? (
        <p className="mt-0.5 text-xs text-muted-foreground">الإجمالي للحجز</p>
      ) : null}
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
      <Button disabled className={cn("font-bold", className)}>
        لا توجد مقاعد كافية
      </Button>
    );
  }

  return (
    <Button
      asChild
      className={cn(
        "h-11 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90",
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
