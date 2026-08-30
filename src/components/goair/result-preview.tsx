import { ArrowLeft, MapPin } from "lucide-react";

import { PriceCard } from "@/components/goair/price-card";
import { FlightPath } from "@/components/flight-path";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/lib/goair";

type ResultPreviewProps = {
  trip: Trip;
};

/** Visual-only preview of a search result — no booking logic. */
export function ResultPreview({ trip }: ResultPreviewProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-card)]">
      <div className="border-b border-border bg-secondary/40 px-4 py-2">
        <p className="text-xs font-bold text-muted-foreground">معاينة نتيجة البحث</p>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold text-primary">
            {trip.origin}
            <ArrowLeft className="mx-1 inline size-4 text-accent" aria-hidden />
            {trip.destination}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-primary">
              {trip.airport_code}
            </span>
            <span>{trip.country}</span>
            {trip.distance_km != null ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {trip.distance_km} كم
              </span>
            ) : null}
          </div>
          <FlightPath className="mt-3 h-5 max-w-xs text-accent/40" />
          <p className="mt-2 text-xs text-muted-foreground">نقل مشترك — سعر ثابت لكل مقعد</p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
          <PriceCard amount={trip.price_usd} label="سعر المقعد" />
          <span className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground opacity-90">
            اختيار
          </span>
        </div>
      </div>
    </Card>
  );
}
