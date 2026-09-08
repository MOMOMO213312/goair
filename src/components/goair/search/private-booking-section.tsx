import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, Lock, Sparkle, Users } from "lucide-react";

import { useStockPhoto } from "@/hooks/use-stock-photo";
import type { PrivateOption, Trip } from "@/lib/goair";
import { fetchPrivateTripOptions, formatUsd } from "@/lib/goair";
import { getVehicleImageByCode } from "@/lib/trip-media";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

function getVehicleBlurb(t: ReturnType<typeof useTranslation>["t"], vehicleCode: string): string | undefined {
  const map: Record<string, string> = {
    car: t("search.privateBooking.vehicleBlurbCar"),
    van: t("search.privateBooking.vehicleBlurbVan"),
    hiace: t("search.privateBooking.vehicleBlurbHiace"),
  };
  return map[vehicleCode];
}

type PrivateBookingSectionProps = {
  trip: Trip;
  destination: string;
  date: string;
  seats: number;
  className?: string;
  id?: string;
};

function PrivateOptionCard({
  option,
  isRecommended,
  destination,
  trip,
  date,
  seats,
}: {
  option: PrivateOption;
  isRecommended: boolean;
  destination: string;
  trip: Trip;
  date: string;
  seats: number;
}) {
  const { t } = useTranslation();
  const dotCount = Math.min(option.capacity, 6);
  // Real photo priority: cached DB image (once resolved, shared by every
  // card for this vehicle tier across the whole site) -> live Pexels
  // resolution via resolve-stock-photo (cached back for next time) ->
  // local static asset while that resolves or if it's ever unavailable.
  const photo = useStockPhoto("vehicle_types", option.vehicleTypeId, null) ?? getVehicleImageByCode(option.vehicleCode);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-shadow",
        isRecommended ? "border-2 border-accent shadow-[var(--shadow-float)]" : "border-border/80",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        {isRecommended ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
            <Sparkle className="size-3" aria-hidden />
            {t("search.privateBooking.recommended")}
          </span>
        ) : null}
        <h3 className="absolute inset-x-0 bottom-0 p-4 font-display text-base font-extrabold text-white">
          {option.vehicleLabelAr}
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {getVehicleBlurb(t, option.vehicleCode) ?? t("search.privateBooking.upToPassengers", { count: option.capacity })}
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
              {t("search.privateBooking.upToLuggage", { count: option.maxLuggage })}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-xs font-bold text-muted-foreground">{t("search.privateBooking.fullVehiclePrice")}</span>
          <span className="font-display text-xl font-extrabold text-accent">{formatUsd(option.priceUsd)}</span>
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
          {t("search.privateBooking.bookPrivateFor", { destination })}
        </Link>
      </div>
    </div>
  );
}

/**
 * "حجز خاص" — book the whole vehicle for one group instead of a shared seat.
 * A separate, self-contained option next to the shared results above; it
 * never replaces or hides the shared/pooled transport that is GoAir's core
 * product. Prices are flat totals per vehicle, auto-priced from the
 * market's average route pricing (see `estimate_private_price` in the DB).
 */
export function PrivateBookingSection({ trip, destination, date, seats, className, id }: PrivateBookingSectionProps) {
  const { t } = useTranslation();
  const { data: options, isLoading } = useQuery({
    queryKey: ["goair", "private-options", trip.id],
    queryFn: () => fetchPrivateTripOptions(trip.id),
  });

  if (isLoading) return null;
  if (!options || options.length === 0) return null;

  // Smallest vehicle that still fits the group the user actually searched for —
  // ties the private-booking cards to the real search instead of showing three static options.
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
          <h2 className="font-display text-lg font-extrabold text-primary">{t("search.privateBooking.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("search.privateBooking.subtitle")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        {options.map((option) => (
          <PrivateOptionCard
            key={option.tripOptionId}
            option={option}
            isRecommended={option.tripOptionId === recommendedId}
            destination={destination}
            trip={trip}
            date={date}
            seats={seats}
          />
        ))}
      </div>
    </section>
  );
}
