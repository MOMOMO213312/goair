import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Armchair,
  CalendarClock,
  Car,
  CheckCircle2,
  Cog,
  Fuel,
  Gauge,
  Gem,
  Loader2,
  MapPin,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { RoadRoute } from "@/components/road-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRentalBookingSafe,
  fetchAvailableRentalVehicles,
  fetchPublicLaunchMarketCountries,
  fetchRentalVehicleCategories,
  formatUsd,
  friendlyErrorMessage,
  quoteRentalPrice,
  type RentalDurationType,
  type RentalVehicle,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const pageMeta = translations[DEFAULT_LANGUAGE].rentACarPage.meta;

// Real, freely-licensed (Unsplash) highway-at-night photo — same hotlinking
// pattern used for the homepage/explore hero imagery (see trip-media.ts /
// index.tsx). Chosen over a bright daytime highway shot because it's
// naturally dark, so it stays clearly visible under the hero's navy→violet
// overlay instead of getting washed out to a flat color.
const rentalHeroImage =
  "https://images.unsplash.com/photo-1695064940434-b81422491b64?q=80&w=1920&auto=format&fit=crop";

export const Route = createFileRoute("/rent-a-car")({
  head: () => ({
    meta: [
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.description },
    ],
  }),
  component: RentACarPage,
});

type Phase = "browse" | "book" | "confirm";
type SortOption = "newest" | "price_asc" | "price_desc";

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  economy: Wallet,
  comfort: Armchair,
  suv: Truck,
  van: Users,
  luxury: Gem,
};

/** Same divided-row language as the site-wide `HeroTrustStrip` (homepage/
 * explore hero) instead of this page's old boxed icon cards. */
function TrustStrip() {
  const { t } = useTranslation();
  const items = [
    { icon: Car, label: t("rentACarPage.trustDriverIncluded") },
    { icon: ShieldCheck, label: t("rentACarPage.trustVerifiedPartners") },
    { icon: Receipt, label: t("rentACarPage.trustClearPricing") },
    { icon: Sparkles, label: t("rentACarPage.trustRange") },
  ];
  return (
    <section className="border-b border-border bg-background">
      <div className="goair-container grid grid-cols-1 gap-y-5 divide-y divide-border py-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 sm:divide-y-0 sm:py-7 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:divide-x-reverse lg:gap-x-0">
        {items.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 pt-5 first:pt-0 sm:pt-0 lg:px-5 lg:first:ps-0 lg:last:pe-0"
          >
            <Icon className="size-6 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
            <p className="text-sm font-bold leading-tight text-primary">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

function RentACarPage() {
  const { t, language } = useTranslation();

  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("all");
  const [fuelFilter, setFuelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const vehiclesQuery = useQuery({
    queryKey: ["goair", "rental-vehicles", countryFilter],
    queryFn: () =>
      fetchAvailableRentalVehicles(countryFilter === "all" ? undefined : countryFilter),
  });

  const categoriesQuery = useQuery({
    queryKey: ["goair", "rental-vehicle-categories"],
    queryFn: fetchRentalVehicleCategories,
  });

  const countriesQuery = useQuery({
    queryKey: ["goair", "public-launch-market-countries"],
    queryFn: fetchPublicLaunchMarketCountries,
  });
  const rentalCountries = countriesQuery.data ?? [];

  const [phase, setPhase] = useState<Phase>("browse");
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);

  // Cities are derived from whatever vehicles are currently loaded (already
  // scoped by countryFilter) rather than a separate query — the dataset is
  // small and this keeps the filter in sync automatically as providers add
  // vehicles in new cities, with no extra migration needed to expand.
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    for (const v of vehiclesQuery.data ?? []) {
      if (v.city) cities.add(v.city);
    }
    return Array.from(cities).sort();
  }, [vehiclesQuery.data]);

  const visibleVehicles = useMemo(() => {
    const list = vehiclesQuery.data ?? [];
    const filtered = list.filter(
      (vehicle) =>
        (cityFilter === "all" || vehicle.city === cityFilter) &&
        (categoryFilter === "all" || vehicle.categoryId === categoryFilter) &&
        (transmissionFilter === "all" || vehicle.transmission === transmissionFilter) &&
        (fuelFilter === "all" || vehicle.fuelType === fuelFilter),
    );
    const sorted = [...filtered];
    if (sortBy === "price_asc") sorted.sort((a, b) => a.dailyRateUsd - b.dailyRateUsd);
    else if (sortBy === "price_desc") sorted.sort((a, b) => b.dailyRateUsd - a.dailyRateUsd);
    return sorted;
  }, [vehiclesQuery.data, cityFilter, categoryFilter, transmissionFilter, fuelFilter, sortBy]);

  const hasAnyVehicles = (vehiclesQuery.data?.length ?? 0) > 0;
  const filtersActive =
    countryFilter !== "all" ||
    cityFilter !== "all" ||
    categoryFilter !== "all" ||
    transmissionFilter !== "all" ||
    fuelFilter !== "all";

  function clearFilters() {
    setCountryFilter("all");
    setCityFilter("all");
    setCategoryFilter("all");
    setTransmissionFilter("all");
    setFuelFilter("all");
  }

  function onSelectVehicle(vehicle: RentalVehicle) {
    setSelectedVehicle(vehicle);
    setPhase("book");
  }

  function onBookingDone() {
    setPhase("confirm");
  }

  function onBookAnother() {
    setSelectedVehicle(null);
    setPhase("browse");
  }

  const heroStats = [
    { value: String(vehiclesQuery.data?.length ?? 0), label: t("rentACarPage.heroStatVehicles") },
    {
      value: String(categoriesQuery.data?.length ?? 0),
      label: t("rentACarPage.heroStatCategories"),
    },
    { value: String(rentalCountries.length), label: t("rentACarPage.heroStatCountries") },
  ];

  return (
    <>
      {phase === "browse" ? (
        <>
          {/* Hero — same dark navy→violet treatment + animated route line as
              the airport-transfer hero/explore pages, so this page reads as
              part of the same site rather than a bolted-on module. */}
          <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary to-violet-deep pb-16 pt-10 sm:pb-20 sm:pt-14">
            <img
              src={rentalHeroImage}
              alt=""
              loading="eager"
              className="absolute inset-0 -z-10 size-full object-cover opacity-70"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/75 via-primary/35 to-violet-deep/70" />
            <RoadRoute className="pointer-events-none absolute inset-x-0 top-6 h-16 w-full text-accent/25 sm:top-10 sm:h-24 [stroke-dasharray:1200] [stroke-dashoffset:1200] motion-safe:animate-[draw-route_1.8s_ease-out_forwards]" />

            <div className="goair-container relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
                <Sparkles className="size-3.5 text-accent" aria-hidden />
                {t("rentACarPage.heroBadge")}
              </p>
              <h1 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-[1.15] text-primary-foreground sm:text-5xl">
                {t("rentACarPage.title")}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                {t("rentACarPage.subtitle")}
              </p>

              <div className="mt-8 flex max-w-lg flex-wrap items-center gap-x-8 gap-y-4 border-t border-primary-foreground/15 pt-6">
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-primary-foreground/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Floating filter panel docked over the hero's bottom edge —
              same "floating over the fold" language as the homepage
              SearchWidget, instead of plain filters sitting under a plain
              heading. */}
          <div className="goair-container relative -mt-10 z-10 sm:-mt-12">
            <div className="rounded-2xl border border-white/30 bg-card/95 p-4 shadow-[var(--shadow-float)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors",
                    categoryFilter === "all"
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border/80 text-muted-foreground hover:border-accent/50",
                  )}
                >
                  {t("rentACarPage.categoryAll")}
                </button>
                {(categoriesQuery.data ?? []).map((category) => {
                  const Icon = CATEGORY_ICONS[category.code] ?? Car;
                  const active = categoryFilter === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryFilter(category.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors",
                        active
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border/80 text-muted-foreground hover:border-accent/50",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {localize(category.label_ar, category.label_en, language)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
                <Select
                  value={countryFilter}
                  onValueChange={(v) => {
                    setCountryFilter(v);
                    setCityFilter("all");
                  }}
                >
                  <SelectTrigger className="w-auto min-w-40">
                    <SelectValue placeholder={t("rentACarPage.filterAllCountries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("rentACarPage.filterAllCountries")}</SelectItem>
                    {rentalCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {availableCities.length > 0 ? (
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-auto min-w-40">
                      <SelectValue placeholder={t("rentACarPage.filterAllCities")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("rentACarPage.filterAllCities")}</SelectItem>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
                  <SelectTrigger className="w-auto min-w-40">
                    <SelectValue placeholder={t("rentACarPage.filterTransmission")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("rentACarPage.filterAllTransmissions")}</SelectItem>
                    <SelectItem value="automatic">{t("rentACarPage.transmissionAutomatic")}</SelectItem>
                    <SelectItem value="manual">{t("rentACarPage.transmissionManual")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={fuelFilter} onValueChange={setFuelFilter}>
                  <SelectTrigger className="w-auto min-w-40">
                    <SelectValue placeholder={t("rentACarPage.filterFuelType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("rentACarPage.filterAllFuelTypes")}</SelectItem>
                    <SelectItem value="petrol">{t("rentACarPage.fuelPetrol")}</SelectItem>
                    <SelectItem value="diesel">{t("rentACarPage.fuelDiesel")}</SelectItem>
                    <SelectItem value="hybrid">{t("rentACarPage.fuelHybrid")}</SelectItem>
                    <SelectItem value="electric">{t("rentACarPage.fuelElectric")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-auto min-w-40">
                    <SelectValue placeholder={t("rentACarPage.sortLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("rentACarPage.sortNewest")}</SelectItem>
                    <SelectItem value="price_asc">{t("rentACarPage.sortPriceAsc")}</SelectItem>
                    <SelectItem value="price_desc">{t("rentACarPage.sortPriceDesc")}</SelectItem>
                  </SelectContent>
                </Select>

                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {t("rentACarPage.clearFilters")}
                  </button>
                ) : null}

                {!vehiclesQuery.isPending && !vehiclesQuery.isError ? (
                  <span className="text-sm text-muted-foreground">
                    {t("rentACarPage.resultsCount").replace(
                      "{count}",
                      String(visibleVehicles.length),
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pt-10 sm:pt-8">
            <TrustStrip />
          </div>

          <div className="goair-section">
            <div className="goair-container max-w-6xl">
              {vehiclesQuery.isPending ? (
                <p className="text-center text-sm text-muted-foreground">
                  {t("rentACarPage.loading")}
                </p>
              ) : vehiclesQuery.isError ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertTriangle className="size-8 text-destructive" aria-hidden />
                  <p className="text-sm text-muted-foreground">{t("rentACarPage.errorLoading")}</p>
                  <Button variant="outline" onClick={() => vehiclesQuery.refetch()}>
                    {t("rentACarPage.retryButton")}
                  </Button>
                </div>
              ) : visibleVehicles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {hasAnyVehicles ? t("rentACarPage.noResultsForFilter") : t("rentACarPage.empty")}
                  </p>
                  {hasAnyVehicles ? (
                    <Button variant="outline" onClick={clearFilters}>
                      {t("rentACarPage.clearFilters")}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleVehicles.map((vehicle) => (
                    <RentalVehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      language={language}
                      onSelect={() => onSelectVehicle(vehicle)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/80 p-4 text-sm">
                <span className="text-muted-foreground">{t("rentACarPage.becomePartnerCta")}</span>
                <Link to="/rent-your-car" className="font-bold text-accent hover:underline">
                  {t("rentACarPage.becomePartnerLink")}
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {phase === "book" && selectedVehicle ? (
        <div className="goair-section">
          <div className="goair-container max-w-6xl">
            <div className="mx-auto max-w-4xl">
              <BookingForm
                vehicle={selectedVehicle}
                language={language}
                onBack={() => setPhase("browse")}
                onDone={onBookingDone}
              />
            </div>
          </div>
        </div>
      ) : null}

      {phase === "confirm" ? (
        <div className="goair-section">
          <div className="goair-container max-w-6xl">
            <div className="mx-auto max-w-lg py-16 text-center">
              <CheckCircle2 className="mx-auto size-14 text-accent" />
              <h1 className="mt-4 font-display text-2xl font-extrabold text-primary">
                {t("rentACarPage.successTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("rentACarPage.successBody")}</p>
              <Button
                className="mt-6 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                onClick={onBookAnother}
              >
                {t("rentACarPage.bookAnother")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RentalVehiclePhoto({
  vehicle,
  categoryLabel,
}: {
  vehicle: RentalVehicle;
  categoryLabel: string | null;
}) {
  const photo = vehicle.photos[0];
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden">
      {photo ? (
        <img
          src={photo}
          alt={vehicle.makeModel}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-secondary to-mist">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Car className="size-5" />
          </span>
        </div>
      )}
      {/* Category badge on the photo itself — same "badge over the hero
          image" language as global rental sites, instead of sitting in the
          text block below. */}
      {categoryLabel ? (
        <span className="absolute start-3 top-3 inline-flex w-fit items-center rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
          {categoryLabel}
        </span>
      ) : null}
    </div>
  );
}

function RentalVehicleCard({
  vehicle,
  language,
  onSelect,
}: {
  vehicle: RentalVehicle;
  language: "ar" | "en";
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const categoryLabel = vehicle.categoryLabelAr
    ? localize(vehicle.categoryLabelAr, vehicle.categoryLabelEn, language)
    : null;

  const specs = [
    {
      icon: Cog,
      label:
        vehicle.transmission === "manual"
          ? t("rentACarPage.transmissionManual")
          : t("rentACarPage.transmissionAutomatic"),
    },
    {
      icon: Fuel,
      label: t(
        vehicle.fuelType === "diesel"
          ? "rentACarPage.fuelDiesel"
          : vehicle.fuelType === "hybrid"
            ? "rentACarPage.fuelHybrid"
            : vehicle.fuelType === "electric"
              ? "rentACarPage.fuelElectric"
              : "rentACarPage.fuelPetrol",
      ),
    },
    vehicle.seats != null
      ? { icon: Users, label: t("rentACarPage.seatsCount", { count: vehicle.seats }) }
      : null,
    {
      icon: Gauge,
      label:
        vehicle.dailyMileageLimitKm != null
          ? t("rentACarPage.mileageLimited", { km: vehicle.dailyMileageLimitKm })
          : t("rentACarPage.mileageUnlimited"),
    },
  ].filter((spec) => spec != null);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]">
      <RentalVehiclePhoto vehicle={vehicle} categoryLabel={categoryLabel} />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-extrabold text-primary">{vehicle.makeModel}</h3>
        {vehicle.city ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {vehicle.city}
            {vehicle.pickupAreaLabel ? ` — ${vehicle.pickupAreaLabel}` : ""}
          </p>
        ) : null}
        {vehicle.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{vehicle.description}</p>
        ) : null}

        {/* Spec strip — the technical facts real rental sites lead with so a
            shopper can compare cars without opening each one. */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-y border-border/70 py-3">
          {specs.map(({ icon: Icon, label }, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Icon className="size-3.5 shrink-0 text-primary/70" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <span
          className={cn(
            "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
            vehicle.insuranceIncluded
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground",
          )}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          {vehicle.insuranceIncluded
            ? t("rentACarPage.insuranceIncluded")
            : t("rentACarPage.insuranceNotIncluded")}
        </span>

        {/* Daily rate is the headline number — same weight global rental
            sites give their per-day price — with hourly/multi-day as
            secondary context underneath rather than three equal-weight
            figures in a row. */}
        <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-border/70 pt-4">
          <div>
            <p className="font-display text-2xl font-extrabold text-primary">
              {formatUsd(vehicle.dailyRateUsd)}
              <span className="ms-1 text-xs font-medium text-muted-foreground">
                {t("rentACarPage.perDay")}
              </span>
            </p>
            {vehicle.hourlyRateUsd != null || vehicle.multiDayRateUsd != null ? (
              <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs font-semibold text-muted-foreground">
                {vehicle.hourlyRateUsd != null ? (
                  <span>
                    {formatUsd(vehicle.hourlyRateUsd)}
                    {t("rentACarPage.perHour")}
                  </span>
                ) : null}
                {vehicle.multiDayRateUsd != null ? (
                  <span>
                    {formatUsd(vehicle.multiDayRateUsd)}
                    {t("rentACarPage.perMultiDay")}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          className="mt-4 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          onClick={onSelect}
        >
          {t("rentACarPage.bookButton")}
        </Button>
      </div>
    </div>
  );
}

const DURATION_PRESETS: { type: RentalDurationType; hours: number }[] = [
  { type: "hourly", hours: 0 }, // uses vehicle.minRentalHours instead
  { type: "daily", hours: 24 },
  { type: "multi_day", hours: 0 }, // uses vehicle.multiDayThresholdDays instead
];

function BookingForm({
  vehicle,
  language,
  onBack,
  onDone,
}: {
  vehicle: RentalVehicle;
  language: "ar" | "en";
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const categoryLabel = vehicle.categoryLabelAr
    ? localize(vehicle.categoryLabelAr, vehicle.categoryLabelEn, language)
    : null;

  const [durationPreset, setDurationPreset] = useState<RentalDurationType>(
    vehicle.hourlyRateUsd != null ? "hourly" : "daily",
  );
  const [start, setStart] = useState(() => toLocalInputValue(defaultStart()));
  const [end, setEnd] = useState(() => {
    const base = defaultStart();
    base.setHours(base.getHours() + Math.max(vehicle.minRentalHours, 1));
    return toLocalInputValue(base);
  });
  const [pickupLocation, setPickupLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  function applyPreset(preset: RentalDurationType) {
    setDurationPreset(preset);
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    if (preset === "hourly") {
      endDate.setHours(endDate.getHours() + Math.max(vehicle.minRentalHours, 1));
    } else if (preset === "daily") {
      endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setDate(endDate.getDate() + Math.max(vehicle.multiDayThresholdDays, 2));
    }
    setEnd(toLocalInputValue(endDate));
  }

  const startIso = useMemo(() => (start ? new Date(start).toISOString() : null), [start]);
  const endIso = useMemo(() => (end ? new Date(end).toISOString() : null), [end]);
  const validRange = Boolean(startIso && endIso && new Date(endIso) > new Date(startIso));

  const quoteQuery = useQuery({
    queryKey: ["goair", "rental-quote", vehicle.id, startIso, endIso],
    queryFn: () => quoteRentalPrice(vehicle.id, startIso!, endIso!),
    enabled: validRange,
    retry: false,
  });

  async function onConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (!validRange || !startIso || !endIso) return;
    if (fullName.trim().length < 3 || phone.trim().length < 7 || pickupLocation.trim().length < 3) {
      toast.error(t("rentACarPage.missingFields"));
      return;
    }
    setBusy(true);
    try {
      await createRentalBookingSafe({
        rentalVehicleId: vehicle.id,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        startDatetime: startIso,
        endDatetime: endIso,
        pickupLocation: pickupLocation.trim(),
      });
      onDone();
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("rentACarPage.bookingError")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        {`← ${t("rentACarPage.backToBrowse")}`}
      </button>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-xl p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-xl font-extrabold text-primary">
            {t("rentACarPage.bookingFormTitle")}
          </h2>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-mist/40 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Car className="size-5" />
            </span>
            <div>
              <p className="font-bold text-primary">{vehicle.makeModel}</p>
              {categoryLabel ? (
                <p className="text-xs text-muted-foreground">{categoryLabel}</p>
              ) : null}
            </div>
          </div>

          <form onSubmit={onConfirm} className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label>{t("rentACarPage.durationTypeLabel")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => applyPreset(preset.type)}
                    disabled={preset.type === "hourly" && vehicle.hourlyRateUsd == null}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors",
                      durationPreset === preset.type
                        ? "border-accent bg-accent/10 text-primary"
                        : "border-border/80 text-muted-foreground hover:border-accent/50",
                      preset.type === "hourly" &&
                        vehicle.hourlyRateUsd == null &&
                        "cursor-not-allowed opacity-50",
                    )}
                  >
                    {preset.type === "hourly"
                      ? t("rentACarPage.durationHourly")
                      : preset.type === "daily"
                        ? t("rentACarPage.durationDaily")
                        : t("rentACarPage.durationMultiDay")}
                  </button>
                ))}
              </div>
              {durationPreset === "hourly" ? (
                <p className="text-xs text-muted-foreground">
                  {t("rentACarPage.minHoursNote").replace(
                    "{hours}",
                    String(vehicle.minRentalHours),
                  )}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rc-start">{t("rentACarPage.startLabel")}</Label>
                <Input
                  id="rc-start"
                  type="datetime-local"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-end">{t("rentACarPage.endLabel")}</Label>
                <Input
                  id="rc-end"
                  type="datetime-local"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc-pickup">{t("rentACarPage.pickupLocationLabel")}</Label>
              <Input
                id="rc-pickup"
                placeholder={t("rentACarPage.pickupLocationPlaceholder")}
                value={pickupLocation}
                onChange={(event) => setPickupLocation(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rc-name">{t("rentACarPage.nameLabel")}</Label>
                <Input
                  id="rc-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-phone">{t("rentACarPage.phoneLabel")}</Label>
                <Input
                  id="rc-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={busy || !validRange || quoteQuery.isPending || quoteQuery.isError}
              className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : null}
              {busy ? t("rentACarPage.submitting") : t("rentACarPage.confirmButton")}
            </Button>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card className="rounded-xl p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <CalendarClock className="size-4" aria-hidden />
              {t("rentACarPage.estimatedTotal")}
            </div>
            <div className="mt-3">
              {!validRange ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : quoteQuery.isPending ? (
                <p className="text-sm text-muted-foreground">{t("rentACarPage.quoting")}</p>
              ) : quoteQuery.isError ? (
                <p className="text-sm text-destructive">{t("rentACarPage.quoteError")}</p>
              ) : (
                <p className="font-display text-3xl font-extrabold text-accent">
                  {formatUsd(quoteQuery.data?.totalUsd ?? 0)}
                </p>
              )}
            </div>
          </Card>

          {pickupLocation ? (
            <Card className="rounded-xl p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <MapPin className="size-4" aria-hidden />
                {t("rentACarPage.pickupLocationLabel")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pickupLocation}</p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
