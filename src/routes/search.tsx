import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  CustomRequestCard,
  type SearchParams,
} from "@/components/goair/search/custom-request-card";
import { SearchEmptyState } from "@/components/goair/search/search-empty-state";
import { SearchFiltersPanel } from "@/components/goair/search/search-filters-panel";
import { SearchFiltersSheet } from "@/components/goair/search/search-filters-sheet";
import { PrivateBookingSection } from "@/components/goair/search/private-booking-section";
import { SearchResultCard } from "@/components/goair/search/search-result-card";
import { SearchResultsSkeleton } from "@/components/goair/search/search-results-skeleton";
import { SearchSortDesktop, SearchSortMobile, type SortKey } from "@/components/goair/search/search-sort";
import { SearchSummary } from "@/components/goair/search/search-summary";
import { Card } from "@/components/ui/card";
import { DestinationCard } from "@/components/goair/destination-card";
import { fetchScheduleOptions, fetchTrips, fetchVehicleTypes, type VehicleType } from "@/lib/goair";
import { getDestinationSummariesForAirport } from "@/lib/trip-stats";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    country: String(search["country"] ?? ""),
    airport: String(search["airport"] ?? ""),
    destination: String(search["destination"] ?? ""),
    date: String(search["date"] ?? new Date().toISOString().slice(0, 10)),
    seats: Math.max(1, Number(search["seats"]) || 1),
    packageId: typeof search["packageId"] === "string" ? search["packageId"] : undefined,
    flight: typeof search["flight"] === "string" && search["flight"] ? search["flight"] : undefined,
    focus: search["focus"] === "private" ? "private" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "المواعيد والأسعار — GoAir" },
      {
        name: "description",
        content: "شوف مواعيد الرحلات المتاحة والسعر الإجمالي قبل الحجز.",
      },
      { property: "og:title", content: "المواعيد والأسعار — GoAir" },
      {
        property: "og:description",
        content: "مواعيد ثابتة وسعر واضح لكل مقعد قبل تأكيد الحجز.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const params = Route.useSearch();
  const [sort, setSort] = useState<SortKey>("recommended");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const vehicleTypesQuery = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const vehicleTypesById = useMemo(() => {
    const map = new Map<string, VehicleType>();
    for (const vehicle of vehicleTypesQuery.data ?? []) map.set(vehicle.id, vehicle);
    return map;
  }, [vehicleTypesQuery.data]);
  const trip = tripsQuery.data?.find(
    (item) =>
      item.country === params.country &&
      item.destination === params.destination &&
      (!params.airport || item.airport_code === params.airport),
  );

  const optionsQuery = useQuery({
    queryKey: ["goair", "schedules", trip?.id, params.date],
    queryFn: () => fetchScheduleOptions(trip!.id, params.date, trip!),
    enabled: Boolean(trip),
  });

  const allOptions = optionsQuery.data ?? [];

  const cheapestPrice = allOptions.length
    ? Math.min(...allOptions.map((option) => option.pricePerSeat))
    : null;

  const earliestTime = allOptions.length
    ? allOptions.reduce((earliest, option) =>
        option.departureTime.localeCompare(earliest.departureTime) < 0 ? option : earliest,
      ).departureTime
    : null;

  const priceCeiling = allOptions.length
    ? Math.ceil(Math.max(...allOptions.map((option) => option.pricePerSeat)))
    : 0;
  const priceFloor = allOptions.length
    ? Math.floor(Math.min(...allOptions.map((option) => option.pricePerSeat)))
    : 0;
  const activeMax = maxPrice ?? priceCeiling;

  const visibleOptions = useMemo(
    () =>
      allOptions
        .filter((option) => option.pricePerSeat <= activeMax)
        .sort((a, b) => {
          if (sort === "cheapest") return a.pricePerSeat - b.pricePerSeat;
          if (sort === "earliest") return a.departureTime.localeCompare(b.departureTime);
          return 0;
        }),
    [allOptions, activeMax, sort],
  );

  // Airport chosen but no specific destination yet (e.g. from the homepage
  // "Explore by airport" card) — show every route from that airport instead
  // of guessing a single one.
  const needsDestinationChoice = !params.destination && Boolean(params.airport);

  const destinationChoices = useMemo(
    () =>
      needsDestinationChoice && tripsQuery.data
        ? getDestinationSummariesForAirport(tripsQuery.data, params.country, params.airport)
        : [],
    [needsDestinationChoice, tripsQuery.data, params.country, params.airport],
  );

  const isLoading = tripsQuery.isLoading || (Boolean(trip) && optionsQuery.isLoading);
  const tripNotFound =
    !needsDestinationChoice && !tripsQuery.isLoading && tripsQuery.data && !trip;
  const activeFilterCount = maxPrice !== null && priceCeiling > priceFloor ? 1 : 0;

  function resetFilters() {
    setMaxPrice(null);
  }

  // "نقل خاص" toggle on the hero jumps here — never hides the shared results.
  useEffect(() => {
    if (params.focus !== "private" || isLoading) return;
    const target = document.getElementById("private-picks");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [params.focus, isLoading]);

  const filterPanelProps = {
    trip,
    country: params.country,
    airportCode: params.airport || trip?.airport_code || "",
    priceFloor,
    priceCeiling,
    activeMaxPrice: activeMax,
    filters: { maxPrice },
    onMaxPriceChange: setMaxPrice,
    onReset: resetFilters,
  };

  return (
    <div className="bg-mist/30 pb-16 pt-8 sm:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        {/* Search summary */}
        <SearchSummary
          trip={trip}
          airportCode={params.airport}
          destination={params.destination}
          country={params.country}
          date={params.date}
          seats={params.seats}
        />

        {trip ? (
          <PrivateBookingSection
            trip={trip}
            destination={params.destination}
            date={params.date}
            seats={params.seats}
            id="private-picks"
          />
        ) : null}

        {needsDestinationChoice ? (
          <div className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-primary sm:text-2xl">
              اختار وجهتك
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {destinationChoices.length}{" "}
              {destinationChoices.length === 1 ? "وجهة متاحة من هذا المطار" : "وجهات متاحة من هذا المطار"}
            </p>

            {destinationChoices.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {destinationChoices.map((destination) => (
                  <DestinationCard
                    key={`${destination.country}-${destination.name}`}
                    destination={destination}
                  />
                ))}
              </div>
            ) : !tripsQuery.isLoading ? (
              <SearchEmptyState
                title="لا توجد وجهات متاحة من هذا المطار حاليًا"
                description="جرّب مطارًا آخر أو عدّل البحث من الصفحة الرئيسية."
              />
            ) : (
              <SearchResultsSkeleton />
            )}
          </div>
        ) : null}

        {tripNotFound ? (
          <div className="mt-8">
            <SearchEmptyState
              title="لم نجد خطًا مطابقًا لبحثك"
              description="تأكد من الوجهة والمطار، أو عدّل البحث من الصفحة الرئيسية."
            />
          </div>
        ) : null}

        {isLoading && !tripNotFound && !needsDestinationChoice ? (
          <div className="mt-8">
            <SearchResultsSkeleton />
          </div>
        ) : null}

        {!isLoading && !tripNotFound && trip && allOptions.length === 0 ? (
          <CustomRequestCard params={params} />
        ) : null}

        {!isLoading && !tripNotFound && allOptions.length > 0 ? (
          <div className="mt-8">
            {/* Results header + sort */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
                  الرحلات المتاحة
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleOptions.length} {visibleOptions.length === 1 ? "رحلة متاحة" : "رحلات متاحة"}
                  {visibleOptions.length !== allOptions.length
                    ? ` من ${allOptions.length}`
                    : ""}
                </p>
              </div>
              <SearchSortDesktop value={sort} onChange={setSort} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:hidden">
              <SearchSortMobile value={sort} onChange={setSort} className="flex-1" />
              <SearchFiltersSheet
                {...filterPanelProps}
                activeFilterCount={activeFilterCount}
                onReset={resetFilters}
              />
            </div>

            {/* Two-column layout */}
            <div className="mt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
              {/* Desktop filters */}
              <div className="hidden lg:block">
                <div className="sticky top-20 rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
                  <SearchFiltersPanel {...filterPanelProps} />
                </div>
              </div>

              {/* Results list */}
              <div className="min-w-0 space-y-4">
                {visibleOptions.length > 0 ? (
                  visibleOptions.map((option) => (
                    <SearchResultCard
                      key={option.scheduleId}
                      trip={trip}
                      option={option}
                      seats={params.seats}
                      travelDate={params.date}
                      packageId={params.packageId}
                      flight={params.flight}
                      vehicleType={
                        option.vehicleTypeId ? vehicleTypesById.get(option.vehicleTypeId) ?? null : null
                      }
                      isBestPrice={
                        visibleOptions.length > 1 &&
                        cheapestPrice !== null &&
                        option.pricePerSeat === cheapestPrice
                      }
                      isFastest={
                        visibleOptions.length > 1 &&
                        earliestTime !== null &&
                        option.departureTime === earliestTime &&
                        option.pricePerSeat !== cheapestPrice
                      }
                    />
                  ))
                ) : (
                  <Card className="border-dashed p-8 text-center">
                    <SearchEmptyState
                      title="لا توجد رحلات في نطاق السعر المختار"
                      description="وسّع نطاق السعر أو امسح الفلاتر لعرض كل المواعيد."
                      showEditSearch={false}
                    />
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 text-sm font-bold text-accent hover:underline"
                    >
                      مسح الفلاتر
                    </button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Schedule load issue — friendly, no technical errors */}
        {!isLoading && trip && optionsQuery.isError ? (
          <Card className="mt-6 border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-display font-bold text-primary">تعذّر تحميل المواعيد الآن</p>
            <p className="mt-2">
              جرّب تحديث الصفحة. إذا استمرت المشكلة، عدّل البحث أو تواصل مع الدعم.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
