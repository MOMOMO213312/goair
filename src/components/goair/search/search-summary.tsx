import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MapPin, Pencil, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/lib/goair";
import { cn } from "@/lib/utils";

type SearchSummaryProps = {
  trip: Trip | undefined;
  airportCode: string;
  destination: string;
  country: string;
  date: string;
  seats: number;
  /** "to_airport" (أنا مسافر) shows the city first, then the airport —
   * the reverse of "from_airport" (أنا واصل), which is the historical default. */
  direction?: "to_airport" | "from_airport";
  className?: string;
};

export function formatSearchDate(dateStr: string) {
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SearchSummary({
  trip,
  airportCode,
  destination,
  country,
  date,
  seats,
  direction = "from_airport",
  className,
}: SearchSummaryProps) {
  const airportLabel = trip?.airport_name ?? trip?.origin ?? airportCode;
  const destLabel = trip?.destination ?? destination;
  const code = trip?.airport_code ?? airportCode;
  const isDeparting = direction === "to_airport";
  const firstLabel = isDeparting ? destLabel : airportLabel;
  const secondLabel = isDeparting ? airportLabel : destLabel;
  const firstCode = isDeparting ? null : code;
  const secondCode = isDeparting ? code : null;

  return (
    <Card
      className={cn(
        "border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-xl font-extrabold text-primary sm:text-2xl">
              {firstLabel}
            </span>
            {firstCode ? (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
                {firstCode}
              </span>
            ) : null}
            <ArrowLeft className="size-5 shrink-0 text-accent" aria-hidden />
            <span className="font-display text-xl font-extrabold text-primary sm:text-2xl">
              {secondLabel}
            </span>
            {secondCode ? (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
                {secondCode}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-accent" aria-hidden />
              {formatSearchDate(date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 shrink-0 text-accent" aria-hidden />
              {seats} {seats === 1 ? "مقعد" : "مقاعد"}
            </span>
            {country ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
                {country}
              </span>
            ) : null}
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 border-accent/40 font-bold text-primary hover:bg-accent/5"
        >
          <Link to="/">
            <Pencil className="size-4" aria-hidden />
            تعديل البحث
          </Link>
        </Button>
      </div>
    </Card>
  );
}
