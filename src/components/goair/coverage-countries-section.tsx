import { CountryExploreCard } from "@/components/goair/country-explore-card";
import { SectionHeader } from "@/components/goair/section-header";
import { useTranslation } from "@/lib/i18n/language-context";
import type { Trip } from "@/lib/goair";
import { filterPublicTrips, getCountrySummaries } from "@/lib/trip-stats";

type CoverageCountriesSectionProps = {
  trips: Trip[];
  countries: string[];
};

/**
 * "الدول اللي بنغطيها" — same spot/role as Suntransfers' "700+ destinations
 * worldwide" grid, but scaled honestly to GoAir's real footprint (currently
 * Egypt + Lebanon) instead of a borrowed/inflated number. Grows on its own
 * as `countries` grows — nothing here is hardcoded.
 */
export function CoverageCountriesSection({ trips, countries }: CoverageCountriesSectionProps) {
  const { t } = useTranslation();
  const publicTrips = filterPublicTrips(trips, countries);
  const summaries = getCountrySummaries(publicTrips, countries).filter(
    (summary) => summary.routeCount > 0,
  );

  if (summaries.length === 0) return null;

  return (
    <section className="bg-mist/60 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title={t("coverageCountries.sectionTitle", { count: summaries.length })}
          description={t("coverageCountries.sectionDescription")}
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {summaries.map((summary) => {
            const sampleTrip = publicTrips.find((trip) => trip.country === summary.country);
            if (!sampleTrip) return null;

            return (
              <CountryExploreCard
                key={summary.country}
                summary={summary}
                sampleAirport={sampleTrip.airport_code}
                sampleDestination={sampleTrip.destination}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
