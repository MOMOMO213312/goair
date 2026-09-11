import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, CalendarX2, ChevronDown, Lock, MapPin, Sparkle, UserRound, Users } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  showTier,
  destination,
  trip,
  date,
  seats,
}: {
  option: PrivateOption;
  isRecommended: boolean;
  /** True when a sibling card exists for the same vehicle type in a different class — that's the only case where standard vs premium needs to be badged. */
  showTier: boolean;
  destination: string;
  trip: Trip;
  date: string;
  seats: number;
}) {
  const { t, language } = useTranslation();
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const isPremium = option.vehicleClass === "premium";
  const dotCount = Math.min(option.capacity, 6);
  const modelName = (language === "ar" ? option.modelNameAr : option.modelNameEn) ?? option.vehicleLabelAr;
  const highlights = language === "ar" ? option.highlightsAr : option.highlightsEn;
  // Real photo priority: dedicated per-class presentation photo (standard vs
  // premium look like different cars) -> generic per-vehicle-type photo for
  // classes with no presentation override (van/hiace) -> local static asset.
  // Both hooks are always called (rules of hooks) — the presentation one is
  // simply disabled (empty id) when this option has no presentation row.
  const presentationPhoto = useStockPhoto("vehicle_class_presentation", option.presentationId ?? "", option.imageUrl);
  const genericPhoto = useStockPhoto("vehicle_types", option.vehicleTypeId, null);
  const photo = presentationPhoto ?? genericPhoto ?? getVehicleImageByCode(option.vehicleCode);

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
        {showTier ? (
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
              isPremium ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {isPremium ? t("search.privateBooking.tierPremiumBadge") : t("search.privateBooking.tierStandardBadge")}
          </span>
        ) : null}
        {isRecommended ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
            <Sparkle className="size-3" aria-hidden />
            {t("search.privateBooking.recommended")}
          </span>
        ) : null}
        <h3 className="absolute inset-x-0 bottom-0 p-4 font-display text-base font-extrabold text-white">{modelName}</h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {getVehicleBlurb(t, option.vehicleCode) ?? t("search.privateBooking.upToPassengers", { count: option.capacity })}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
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
          {trip.distance_km != null ? (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <MapPin className="size-3.5 text-muted-foreground/70" aria-hidden />
              {t("search.filters.distanceKm", { km: trip.distance_km })}
            </span>
          ) : null}
        </div>

        {/* Same trust perks as the shared-ride cards, for a consistent promise across booking types */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarX2 className="size-3.5 text-accent" aria-hidden />
            {t("search.resultCard.freeCancellation")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5 text-accent" aria-hidden />
            {t("search.resultCard.namedPickup")}
          </span>
        </div>

        {highlights.length > 0 ? (
          <Collapsible open={highlightsOpen} onOpenChange={setHighlightsOpen} className="mt-3 border-t border-border pt-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-bold text-primary">
              {t("search.privateBooking.serviceHighlights")}
              <ChevronDown className={cn("size-3.5 transition-transform", highlightsOpen ? "rotate-180" : "")} aria-hidden />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {highlights.map((line, i) => (
                <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                  · {line}
                </p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}

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
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
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

  // A vehicle type only needs a tier badge when it actually has more than one
  // class in this result set (e.g. car: standard + premium) — otherwise a
  // lone "Standard" chip on the one-and-only hiace option is just noise.
  const classesByVehicleType = new Map<string, Set<string>>();
  for (const option of options) {
    const set = classesByVehicleType.get(option.vehicleTypeId) ?? new Set<string>();
    set.add(option.vehicleClass);
    classesByVehicleType.set(option.vehicleTypeId, set);
  }

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
            showTier={(classesByVehicleType.get(option.vehicleTypeId)?.size ?? 1) > 1}
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
