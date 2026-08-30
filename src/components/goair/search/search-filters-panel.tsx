import { MapPin, RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Trip } from "@/lib/goair";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

export type SearchFiltersState = {
  maxPrice: number | null;
};

type SearchFiltersPanelProps = {
  trip: Trip | undefined;
  country: string;
  airportCode: string;
  priceFloor: number;
  priceCeiling: number;
  activeMaxPrice: number;
  filters: SearchFiltersState;
  onMaxPriceChange: (value: number) => void;
  onReset: () => void;
  className?: string;
  showReset?: boolean;
};

export function SearchFiltersPanel({
  trip,
  country,
  airportCode,
  priceFloor,
  priceCeiling,
  activeMaxPrice,
  filters,
  onMaxPriceChange,
  onReset,
  className,
  showReset = true,
}: SearchFiltersPanelProps) {
  const hasActiveFilters = filters.maxPrice !== null && priceCeiling > priceFloor;

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-primary">
          <SlidersHorizontal className="size-4 text-accent" aria-hidden />
          تصفية النتائج
        </h2>
        {showReset && hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1 text-xs font-bold text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            مسح
          </Button>
        ) : null}
      </div>

      {/* Route context — read-only, from current search */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-xs font-bold text-muted-foreground">رحلتك الحالية</p>
        <dl className="mt-3 space-y-2 text-sm">
          {airportCode ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">المطار</dt>
              <dd className="font-bold text-primary">
                {trip?.airport_name ?? airportCode}{" "}
                <span className="text-xs text-muted-foreground">({airportCode})</span>
              </dd>
            </div>
          ) : null}
          {country ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">الدولة</dt>
              <dd className="font-bold text-primary">{country}</dd>
            </div>
          ) : null}
          {trip?.distance_km != null ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">المسافة</dt>
              <dd className="inline-flex items-center gap-1 font-bold text-primary">
                <MapPin className="size-3.5 text-accent" aria-hidden />
                {trip.distance_km} كم
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Price filter */}
      {priceCeiling > 0 ? (
        <div className="space-y-3">
          <Label className="font-display text-sm font-bold text-primary">السعر للمقعد</Label>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>من {formatUsd(priceFloor)}</span>
            <span className="font-bold text-primary">إلى {formatUsd(activeMaxPrice)}</span>
          </div>
          {priceCeiling > priceFloor ? (
            <Slider
              min={priceFloor}
              max={priceCeiling}
              step={1}
              value={[activeMaxPrice]}
              onValueChange={(value) => onMaxPriceChange(value[0] ?? priceCeiling)}
              aria-label="الحد الأقصى للسعر"
            />
          ) : (
            <p className="text-xs text-muted-foreground">سعر ثابت لجميع المواعيد.</p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
