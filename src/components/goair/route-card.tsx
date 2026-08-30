import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";

import { PriceCard } from "@/components/goair/price-card";
import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/lib/goair";
import { getTripCityLocation, getTripRouteImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

type RouteCardProps = {
  trip: Trip;
  className?: string;
  compact?: boolean;
};

export function RouteCard({ trip, className, compact }: RouteCardProps) {
  const image = getTripRouteImage(trip);
  const cityLabel = getTripCityLocation(trip);
  const searchDate = new Date().toISOString().slice(0, 10);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/80 p-0 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        compact ? "min-w-[280px] shrink-0 snap-start" : "",
        className,
      )}
    >
      {image ? (
        <img
          src={image}
          alt={`وجهة ${trip.destination}`}
          width={640}
          height={400}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <DestinationPlaceholder destination={cityLabel} />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-secondary px-2 py-0.5 font-display text-xs font-bold text-primary">
            {trip.airport_code}
          </span>
          <span className="text-xs text-muted-foreground">{trip.country}</span>
        </div>

        <h3 className="mt-3 font-display text-base font-bold leading-snug text-primary sm:text-lg">
          {trip.origin}
          <ArrowLeft className="mx-1 inline size-4 text-accent" aria-hidden />
          {trip.destination}
        </h3>

        {trip.distance_km != null ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            المسافة {trip.distance_km} كم
          </p>
        ) : null}

        <FlightPath className="mt-3 h-5 w-full text-accent/40" />

        <div className="mt-4 flex items-end justify-between gap-3">
          <PriceCard amount={trip.price_usd} />
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Link
              to="/search"
              search={{
                country: trip.country,
                airport: trip.airport_code,
                destination: trip.destination,
                date: searchDate,
                seats: 1,
              }}
            >
              اعرض الرحلات
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
