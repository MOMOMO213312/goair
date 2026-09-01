import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Card } from "@/components/ui/card";
import type { AirportSummary } from "@/lib/trip-stats";
import { getAirportImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

type AirportCardProps = {
  airport: AirportSummary;
  className?: string;
};

export function AirportCard({ airport, className }: AirportCardProps) {
  const searchDate = new Date().toISOString().slice(0, 10);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/80 p-0 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={getAirportImage(airport.code)}
          alt={airport.name}
          width={640}
          height={360}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
        <span className="absolute bottom-3 right-3 rounded-md bg-primary-foreground/15 px-2 py-1 font-display text-xs font-bold text-primary-foreground backdrop-blur-sm">
          {airport.code}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Plane className="size-4 -rotate-45" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-primary">{airport.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {airport.routeCount} {airport.routeCount === 1 ? "خط متاح" : "خطوط متاحة"}
            </p>
          </div>
        </div>

        <Link
          to="/search"
          search={{
            country: airport.country,
            airport: airport.code,
            destination: "",
            date: searchDate,
            seats: 1,
          }}
          className="mt-4 block rounded-lg border border-border bg-secondary/50 py-2.5 text-center text-sm font-bold text-primary transition-colors hover:bg-secondary"
        >
          استكشف الرحلات
        </Link>
      </div>
    </Card>
  );
}

type AirportGridProps = {
  airports: AirportSummary[];
};

export function AirportGrid({ airports }: AirportGridProps) {
  return (
    <section id="stations" className="scroll-mt-24 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title="استكشف حسب المطار"
          description="اختر مطار المغادرة أو الوصول وشوف الخطوط المتاحة من بيانات GoAir."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {airports.map((airport) => (
            <AirportCard key={airport.code} airport={airport} />
          ))}
        </div>
      </div>
    </section>
  );
}
