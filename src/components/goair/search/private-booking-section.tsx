import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, CalendarX2, ChevronDown, Lock, MapPin, Sparkle, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStockPhoto } from "@/hooks/use-stock-photo";
import type { PrivateOption, Trip } from "@/lib/goair";
import { fetchPrivateTripOptions, formatUsd, submitCustomRequest } from "@/lib/goair";
import { getVehicleImageByCode } from "@/lib/trip-media";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Vehicle types that stay OUT of the instant-priced private catalog. A van or
 * hiace booked privately (whole vehicle, no pooling) is rare enough that a
 * flat auto-priced total isn't worth maintaining — instead these become a
 * manual "request a quote" ask (reuses the custom_requests table/admin queue),
 * same as any other non-standard route. Sedan/car stays instant-priced.
 */
const QUOTE_ONLY_VEHICLE_CODES = new Set(["van", "hiace"]);

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
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-shadow sm:flex-row",
        isRecommended ? "border-2 border-accent shadow-[var(--shadow-float)]" : "border-border/80",
      )}
    >
      {/* Photo — fixed-width column on desktop, matching a horizontal
          "search results" row instead of a stacked card. */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48 md:w-56">
        <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        {showTier ? (
          <span
            className={cn(
              "absolute start-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
              isPremium ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {isPremium ? t("search.privateBooking.tierPremiumBadge") : t("search.privateBooking.tierStandardBadge")}
          </span>
        ) : null}
      </div>

      {/* Details — the middle column. */}
      <div className="flex flex-1 flex-col justify-center gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-extrabold text-primary sm:text-lg">{modelName}</h3>
          {isRecommended ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
              <Sparkle className="size-3" aria-hidden />
              {t("search.privateBooking.recommended")}
            </span>
          ) : null}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {getVehicleBlurb(t, option.vehicleCode) ?? t("search.privateBooking.upToPassengers", { count: option.capacity })}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
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
          <Collapsible open={highlightsOpen} onOpenChange={setHighlightsOpen} className="border-t border-border pt-3">
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
      </div>

      {/* Price + CTA — its own column on desktop, divided from the details
          by a border, so price and the booking action are the first thing
          the eye lands on (matches a horizontal results-row layout). */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-t border-border p-5 text-center sm:w-52 sm:border-t-0 sm:border-s sm:border-border">
        {QUOTE_ONLY_VEHICLE_CODES.has(option.vehicleCode) ? (
          <>
            <span className="text-xs font-bold text-muted-foreground">{t("search.privateBooking.quoteOnRequest")}</span>
            <PrivateQuoteRequestForm option={option} trip={trip} destination={destination} date={date} seats={seats} />
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-muted-foreground">{t("search.privateBooking.fullVehiclePrice")}</span>
            <span className="font-display text-2xl font-extrabold text-accent">{formatUsd(option.priceUsd)}</span>
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
              className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {t("search.privateBooking.bookPrivateFor", { destination })}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function PrivateQuoteRequestForm({
  option,
  trip,
  destination,
  date,
  seats,
}: {
  option: PrivateOption;
  trip: Trip;
  destination: string;
  date: string;
  seats: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t("search.customRequest.invalidName"));
      return;
    }
    if (phone.trim().length < 7) {
      toast.error(t("search.customRequest.invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      await submitCustomRequest({
        country: trip.country,
        routeName: `${trip.airport_name} — ${destination}`,
        preferredDate: date,
        passengerName: name.trim(),
        phone: phone.trim(),
        pax: seats,
        tier: option.vehicleCode,
      });
      setDone(true);
      toast.success(t("search.customRequest.submitSuccess"));
    } catch {
      toast.error(t("search.customRequest.submitError"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-sm font-bold text-accent">{t("search.customRequest.submitted")}</p>;
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
      >
        {t("search.privateBooking.requestQuoteButton")}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 text-start">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t("search.customRequest.namePlaceholder")}
        className="h-10"
      />
      <Input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+20 1XX XXX XXXX"
        className="h-10"
      />
      <Button type="submit" disabled={busy} className="h-10 bg-accent font-bold text-accent-foreground hover:bg-accent/90">
        {t("search.privateBooking.requestQuoteSubmit")}
      </Button>
    </form>
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
  // Prefer instantly-bookable options for the "recommended" badge — a quote-only
  // van/hiace card has no instant price to steer anyone toward.
  const instantOptions = options.filter((option) => !QUOTE_ONLY_VEHICLE_CODES.has(option.vehicleCode));
  const recommendationPool = instantOptions.length > 0 ? instantOptions : options;
  const fitting = recommendationPool.filter((option) => option.capacity >= seats);
  const recommendedId = (fitting.length > 0
    ? fitting.reduce((best, option) => (option.capacity < best.capacity ? option : best))
    : recommendationPool.reduce((best, option) => (option.capacity > best.capacity ? option : best))
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

      <div className="mt-4 space-y-4">
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
