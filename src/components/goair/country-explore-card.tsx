import { Link } from "@tanstack/react-router";

import { Card } from "@/components/ui/card";
import type { CountrySummary } from "@/lib/trip-stats";
import { getCountryImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

type CountryExploreCardProps = {
  summary: CountrySummary;
  sampleDestination: string;
  sampleAirport: string;
  className?: string;
};

export function CountryExploreCard({
  summary,
  sampleDestination,
  sampleAirport,
  className,
}: CountryExploreCardProps) {
  const searchDate = new Date().toISOString().slice(0, 10);

  return (
    <Card
      className={cn(
        "group relative isolate overflow-hidden border-0 p-0 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      <img
        src={getCountryImage(summary.country)}
        alt={summary.country}
        width={1024}
        height={640}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:aspect-[21/9]"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-primary/20" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
            {summary.country}
          </h3>
          <p className="mt-1 text-sm text-primary-foreground/85">
            {summary.routeCount} {summary.routeCount === 1 ? "خط نشط" : "خطوط نشطة"}
          </p>
        </div>
        <Link
          to="/search"
          search={{
            country: summary.country,
            airport: sampleAirport,
            destination: sampleDestination,
            date: searchDate,
            seats: 1,
          }}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          استكشف الرحلات
        </Link>
      </div>
    </Card>
  );
}
