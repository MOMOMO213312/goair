import { MapPin, RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Trip } from "@/lib/goair";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";
import { getCountryLabel } from "@/lib/i18n/country-labels";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";

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
  const { t, language } = useTranslation();
  const hasActiveFilters = filters.maxPrice !== null && priceCeiling > priceFloor;

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-primary">
          <SlidersHorizontal className="size-4 text-accent" aria-hidden />
          {t("search.filters.title")}
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
            {t("search.filters.clear")}
          </Button>
        ) : null}
      </div>

      {/* Route context — read-only, from current search */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-xs font-bold text-muted-foreground">{t("search.filters.currentTrip")}</p>
        <dl className="mt-3 space-y-2 text-sm">
          {airportCode ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t("search.filters.airport")}</dt>
              <dd className="font-bold text-primary">
                {trip ? localize(trip.airport_name, trip.airport_name_en, language) : airportCode}{" "}
                <span className="text-xs text-muted-foreground">({airportCode})</span>
              </dd>
            </div>
          ) : null}
          {country ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t("search.filters.country")}</dt>
              <dd className="font-bold text-primary">{getCountryLabel(country, language)}</dd>
            </div>
          ) : null}
          {trip?.distance_km != null ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t("search.filters.distance")}</dt>
              <dd className="inline-flex items-center gap-1 font-bold text-primary">
                <MapPin className="size-3.5 text-accent" aria-hidden />
                {t("search.filters.distanceKm", { km: trip.distance_km })}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Price filter */}
      {priceCeiling > 0 ? (
        <div className="space-y-3">
          <Label className="font-display text-sm font-bold text-primary">{t("search.filters.pricePerSeat")}</Label>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("search.filters.priceFrom", { price: formatUsd(priceFloor) })}</span>
            <span className="font-bold text-primary">{t("search.filters.priceTo", { price: formatUsd(activeMaxPrice) })}</span>
          </div>
          {priceCeiling > priceFloor ? (
            <Slider
              min={priceFloor}
              max={priceCeiling}
              step={1}
              value={[activeMaxPrice]}
              onValueChange={(value) => onMaxPriceChange(value[0] ?? priceCeiling)}
              aria-label={t("search.filters.maxPriceLabel")}
            />
          ) : (
            <p className="text-xs text-muted-foreground">{t("search.filters.fixedPriceNote")}</p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
