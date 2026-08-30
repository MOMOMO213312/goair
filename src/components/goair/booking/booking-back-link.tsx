import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { Trip } from "@/lib/goair";
import { cn } from "@/lib/utils";

type BookingBackLinkProps = {
  trip: Trip | undefined;
  date: string;
  seats: number;
  className?: string;
};

export function BookingBackLink({ trip, date, seats, className }: BookingBackLinkProps) {
  if (!trip) {
    return (
      <Link
        to="/"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary",
          className,
        )}
      >
        <ArrowRight className="size-4" aria-hidden />
        العودة للرحلات
      </Link>
    );
  }

  return (
    <Link
      to="/search"
      search={{
        country: trip.country,
        airport: trip.airport_code,
        destination: trip.destination,
        date,
        seats,
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <ArrowRight className="size-4" aria-hidden />
      العودة للرحلات
    </Link>
  );
}
