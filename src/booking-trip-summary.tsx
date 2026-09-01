import { ArrowLeft, CalendarDays, Clock, Info, Users } from "lucide-react";

import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { formatSearchDate } from "@/components/goair/search/search-summary";
import { FlightPath } from "@/components/flight-path";
import { Card } from "@/components/ui/card";
import { useDestinationPhoto } from "@/hooks/use-destination-photo";
import type { Trip } from "@/lib/goair";
import { formatTime, isGeneratedScheduleId } from "@/lib/goair";
import { getTripCityLocation, getTripRouteImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

function isFallbackSchedule(scheduleId: string) {
  return isGeneratedScheduleId(scheduleId);
}

type BookingTripSummaryProps = {
  trip: Trip | undefined;
  date: string;
  time: string;
  seats: number;
  scheduleId: string;
  className?: string;
};

export function BookingTripSummary({
  trip,
  date,
  time,
  seats,
  scheduleId,
  className,
}: BookingTripSummaryProps) {
  const fallback = isFallbackSchedule(scheduleId);
  const cityLabel = trip ? getTripCityLocation(trip) : "";
  const localImage = trip ? getTripRouteImage(trip) : null;
  const image = useDestinationPhoto(localImage, cityLabel, trip?.country ?? "");
  const originLabel = trip?.airport_name ?? trip?.origin ?? "المطار";
  const destLabel = trip?.destination ?? "الوجهة";
  const airportCode = trip?.airport_code ?? "";

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
          height={120}
          loading="lazy"
          className="h-24 w-full object-cover sm:h-28"
        />
      ) : trip ? (
        <DestinationPlaceholder destination={cityLabel || trip.destination} className="h-24 sm:h-28" />
      ) : null}

      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">ملخص الرحلة</p>

        {/* Route */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-base font-extrabold text-primary sm:text-lg">
            {originLabel}
          </span>
          {airportCode ? (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
              {airportCode}
            </span>
          ) : null}
          <ArrowLeft className="size-4 shrink-0 text-accent" aria-hidden />
          <span className="font-display text-base font-extrabold text-primary sm:text-lg">
            {destLabel}
          </span>
        </div>

        {/* Route visual */}
        <div className="mt-4 flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground">المطار</p>
            <p className="mt-0.5 font-display text-sm font-bold text-primary">
              {airportCode || "—"}
            </p>
          </div>
          <div className="relative min-w-0 flex-1 px-1">
            <FlightPath className="h-7 w-full text-accent/50" />
          </div>
          <div className="max-w-[7rem] text-center">
            <p className="text-[10px] font-bold text-muted-foreground">الوجهة</p>
            <p className="mt-0.5 truncate font-display text-sm font-bold text-primary">{destLabel}</p>
          </div>
        </div>

        {/* Details */}
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-4 text-accent" aria-hidden />
              التاريخ
            </dt>
            <dd className="font-bold text-primary">{formatSearchDate(date)}</dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4 text-accent" aria-hidden />
              موعد المغادرة
            </dt>
            <dd className="font-bold text-primary">
              {formatTime(time) || time.slice(0, 5) || "—"}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4 text-accent" aria-hidden />
              المقاعد
            </dt>
            <dd className="font-bold text-primary">
              {seats} {seats === 1 ? "مقعد" : "مقاعد"}
            </dd>
          </div>
        </dl>

        {fallback ? (
          <div className="mt-4 space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
            <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium">
              مواعيد مرجعية
            </span>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              يُؤكَّد توفر المقعد عند إتمام الحجز
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
