import { useMemo, useState } from "react";

import { DestinationCard } from "@/components/goair/destination-card";
import { EmptyState } from "@/components/goair/empty-state";
import { SectionHeader } from "@/components/goair/section-header";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import type { Trip } from "@/lib/goair";
import {
  getAirportSummaries,
  getDestinationSummariesForAirport,
  type DestinationSummary,
} from "@/lib/trip-stats";
import { cn } from "@/lib/utils";

const ALL_AIRPORTS = "all" as const;

type ExploreRoutesSectionProps = {
  trips: Trip[];
  countries: string[];
};

/**
 * One home-page section for "find your route", replacing the old three
 * separate sections (popular routes / by airport / by destination) that
 * all pointed at the same data. A single set of destination cards,
 * filterable by departure airport.
 */
export function ExploreRoutesSection({ trips, countries }: ExploreRoutesSectionProps) {
  const { t, language } = useTranslation();
  const publicTrips = useMemo(
    () => trips.filter((trip) => countries.includes(trip.country)),
    [trips, countries],
  );

  const airports = useMemo(() => getAirportSummaries(publicTrips), [publicTrips]);

  const [selectedAirport, setSelectedAirport] = useState<string>(ALL_AIRPORTS);

  const destinations: DestinationSummary[] = useMemo(() => {
    if (selectedAirport === ALL_AIRPORTS) {
      const map = new Map<string, DestinationSummary>();
      for (const airport of airports) {
        for (const dest of getDestinationSummariesForAirport(
          publicTrips,
          airport.country,
          airport.code,
        )) {
          const key = `${dest.country}::${dest.name}`;
          const existing = map.get(key);
          if (existing) {
            existing.routeCount += dest.routeCount;
            if (dest.minPriceUsd != null && (existing.minPriceUsd == null || dest.minPriceUsd < existing.minPriceUsd)) {
              existing.minPriceUsd = dest.minPriceUsd;
            }
          } else {
            map.set(key, { ...dest });
          }
        }
      }
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
    }

    const airport = airports.find((a) => a.code === selectedAirport);
    if (!airport) return [];
    return getDestinationSummariesForAirport(publicTrips, airport.country, airport.code);
  }, [airports, publicTrips, selectedAirport]);

  const visibleDestinations = destinations.slice(0, 8);

  return (
    <section id="stations" className="scroll-mt-24 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title={t("exploreRoutesSection.sectionTitle")}
          description={t("exploreRoutesSection.sectionDescription")}
        />

        {airports.length > 1 ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedAirport(ALL_AIRPORTS)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                selectedAirport === ALL_AIRPORTS
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {t("exploreRoutesSection.allAirports")}
            </button>
            {airports.map((airport) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => setSelectedAirport(airport.code)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  selectedAirport === airport.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {localize(airport.name, airport.nameEn, language)}
              </button>
            ))}
          </div>
        ) : null}

        {visibleDestinations.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleDestinations.map((destination) => (
              <DestinationCard
                key={`${destination.country}-${destination.name}`}
                destination={destination}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            title={t("exploreRoutesSection.emptyTitle")}
            description={t("exploreRoutesSection.emptyDescription")}
          />
        )}
      </div>
    </section>
  );
}
