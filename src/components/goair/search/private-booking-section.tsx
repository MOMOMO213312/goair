import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, Bus, Car, Caravan, Lock, Sparkle, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { Trip } from "@/lib/goair";
import { fetchPrivateTripOptions, formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

const VEHICLE_BLURB: Record<string, string> = {
  car: "لغاية 4 ركاب — أسرع وأخصوصية لعيلة أو مجموعة صغيرة.",
  van: "لغاية 8 ركاب — العربية كلها لمجموعتك من غير مشاركة حد.",
  hiace: "لغاية 14 راكب — أنسب لمجموعات السياحة والشركات.",
};

const VEHICLE_ICON: Record<string, typeof Car> = {
  car: Car,
  van: Caravan,
  hiace: Bus,
};

type PrivateBookingSectionProps = {
  trip: Trip;
  destination: string;
  date: string;
  seats: number;
  className?: string;
  id?: string;
};

/**
 * "حجز خاص" — book the whole vehicle for one group instead of a shared seat.
 * A separate, self-contained option next to the shared results above; it
 * never replaces or hides the shared/pooled transport that is GoAir's core
 * product. Prices are flat totals per vehicle, auto-priced from the
 * market's average route pricing (see `estimate_private_price` in the DB).
 */
export function PrivateBookingSection({ trip, destination, date, seats, className, id }: PrivateBookingSectionProps) {
  const { data: options, isLoading } = useQuery({
    queryKey: ["goair", "private-options", trip.id],
    queryFn: () => fetchPrivateTripOptions(trip.id),
  });

  if (isLoading) return null;
  if (!options || options.length === 0) return null;

  // Smallest vehicle that still fits the group the user actually searched for —
  // ties the "حجز خاص" cards to the real search instead of showing three static options.
  const fitting = options.filter((option) => option.capacity >= seats);
  const recommendedId = (fitting.length > 0
    ? fitting.reduce((best, option) => (option.capacity < best.capacity ? option : best))
    : options.reduce((best, option) => (option.capacity > best.capacity ? option : best))
  ).tripOptionId;

  return (
    <section id={id} className={cn("scroll-mt-20 mt-8", className)}>
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lock className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-extrabold text-primary">حجز خاص</h2>
          <p className="text-sm text-muted-foreground">
            العربية كلها لمجموعتك بس — مفيش ركاب تانيين، وسعر ثابت مش لكل مقعد.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {options.map((option) => {
          const VehicleIcon = VEHICLE_ICON[option.vehicleCode] ?? Users;
          const isRecommended = option.tripOptionId === recommendedId;
          const dotCount = Math.min(option.capacity, 6);

          return (
            <Card
              key={option.tripOptionId}
              className={cn(
                "flex flex-col p-5 shadow-[var(--shadow-card)] transition-shadow",
                isRecommended
                  ? "border-2 border-accent shadow-[var(--shadow-float)]"
                  : "border-border/80",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <VehicleIcon className="size-5.5" aria-hidden />
                </span>
                {isRecommended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
                    <Sparkle className="size-3" aria-hidden />
                    الأنسب لمجموعتك
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 font-display text-base font-extrabold text-primary">
                {option.vehicleLabelAr}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {VEHICLE_BLURB[option.vehicleCode] ?? `لغاية ${option.capacity} راكب.`}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center -space-x-1 space-x-reverse">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <Users key={i} className="size-3.5 text-accent" aria-hidden />
                  ))}
                  {option.capacity > dotCount ? (
                    <span className="ms-1 text-xs font-bold text-accent">+{option.capacity - dotCount}</span>
                  ) : null}
                </div>
                {option.maxLuggage != null ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                    <Briefcase className="size-3.5 text-muted-foreground/70" aria-hidden />
                    حتى {option.maxLuggage} حقيبة
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-xs font-bold text-muted-foreground">السعر الكامل للعربية</span>
                <span className="font-display text-xl font-extrabold text-accent">
                  {formatUsd(option.priceUsd)}
                </span>
              </div>

              <Link
                to="/book"
                search={{
                  tripId: trip.id,
                  scheduleId: "",
                  tripOptionId: option.tripOptionId,
                  date,
                  seats: Math.min(seats, option.capacity),
                  time: "",
                  price: option.priceUsd,
                  bookingType: "private",
                  vehicleTypeId: option.vehicleTypeId,
                }}
                className={cn(
                  "mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                  isRecommended
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                احجز خاص لـ {destination}
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
