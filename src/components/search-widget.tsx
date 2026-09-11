import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Globe2,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SearchCombobox } from "@/components/goair/search-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCountryLabel } from "@/lib/i18n/country-labels";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import type { Trip } from "@/lib/goair";
import {
  getAirportsForCountry,
  getAirportsForDestination,
  getDestinationsForAirport,
} from "@/lib/trip-stats";
import { cn } from "@/lib/utils";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Direction replaces the old One-way/Round-trip framing — GoAir only ever
 * sells a single-direction airport transfer, so the real question is which
 * end of the trip the customer already knows: their own city ("مسافر",
 * heading to the airport) or the airport they're landing at ("واصل").
 */
type Direction = "to_airport" | "from_airport";

export function SearchWidget({
  trips,
  countries,
  initial,
  className,
}: {
  trips: Trip[];
  countries: string[];
  initial?: {
    country?: string;
    airport?: string;
    destination?: string;
    date?: string;
    seats?: number;
    direction?: Direction;
  };
  className?: string;
}) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? "from_airport");
  const [country, setCountry] = useState(initial?.country ?? countries[0] ?? "");
  const [airport, setAirport] = useState(initial?.airport ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [seats, setSeats] = useState(initial?.seats ?? 1);
  const [flight, setFlight] = useState("");
  const [showFlightField, setShowFlightField] = useState(false);

  const isDeparting = direction === "to_airport";

  const visibleTrips = useMemo(
    () => trips.filter((trip) => countries.includes(trip.country)),
    [trips, countries],
  );

  const airports = useMemo(
    () => getAirportsForCountry(visibleTrips, country),
    [visibleTrips, country],
  );

  // Every destination in the country — the starting list for "أنا مسافر",
  // where the customer names their own city before narrowing to an airport.
  const allDestinationsInCountry = useMemo(
    () =>
      Array.from(
        new Set(
          visibleTrips.filter((trip) => trip.country === country).map((trip) => trip.destination),
        ),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    [visibleTrips, country],
  );

  // Destinations narrowed to the chosen airport — used first for "أنا واصل".
  const destinationsForAirport = useMemo(
    () =>
      airport
        ? getDestinationsForAirport(visibleTrips, country, airport)
        : allDestinationsInCountry,
    [visibleTrips, country, airport, allDestinationsInCountry],
  );

  // Airports narrowed to the chosen destination — used second for "أنا مسافر".
  const airportsForDestination = useMemo(
    () => (destination ? getAirportsForDestination(visibleTrips, country, destination) : airports),
    [visibleTrips, country, destination, airports],
  );

  const destinations = isDeparting ? allDestinationsInCountry : destinationsForAirport;
  const airportChoices = isDeparting ? airportsForDestination : airports;

  useEffect(() => {
    if (!country && countries[0]) setCountry(countries[0]);
  }, [country, countries]);

  // Auto-select when there's only one sensible option — same convenience as
  // before, just driven by whichever field is "second" for this direction.
  useEffect(() => {
    if (!isDeparting && !airport && airports[0]?.code) setAirport(airports[0].code);
  }, [isDeparting, airport, airports]);

  useEffect(() => {
    if (isDeparting && destination && !airport && airportsForDestination.length === 1) {
      const only = airportsForDestination[0];
      if (only) setAirport(only.code);
    }
  }, [isDeparting, destination, airport, airportsForDestination]);

  const airportOptions = useMemo(
    () => airportChoices.map((item) => ({ value: item.code, label: localize(item.name, item.nameEn ?? null, language), hint: item.code })),
    [airportChoices, language],
  );

  // Arabic destination string -> English translation, built from the raw
  // trip rows (allDestinationsInCountry/destinationsForAirport are plain
  // Arabic strings used as-is for filtering — this only affects the label).
  const destinationEnByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const trip of visibleTrips) {
      if (trip.destination_en) map.set(trip.destination, trip.destination_en);
    }
    return map;
  }, [visibleTrips]);

  const destinationOptions = useMemo(
    () =>
      destinations.map((item) => ({
        value: item,
        label: localize(item, destinationEnByName.get(item) ?? null, language),
      })),
    [destinations, destinationEnByName, language],
  );

  const quickRoutes = useMemo(() => {
    const seen = new Set<string>();
    const result: typeof visibleTrips = [];
    for (const trip of visibleTrips) {
      const key = `${trip.origin}|${trip.destination}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(trip);
      }
      if (result.length >= 3) break;
    }
    return result;
  }, [visibleTrips]);

  function selectDirection(next: Direction) {
    if (next === direction) return;
    setDirection(next);
    // Switching direction flips which field is "known first" — clear both
    // so the customer picks fresh instead of carrying a stale, wrong-order combo.
    setAirport("");
    setDestination("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!country || !destination || !airport) {
      toast.error(
        isDeparting ? t("searchWidget.errorToAirport") : t("searchWidget.errorFromAirport"),
      );
      return;
    }
    navigate({
      to: "/search",
      search: {
        country,
        airport,
        destination,
        date,
        seats,
        direction,
        ...(flight.trim() ? { flight: flight.trim() } : {}),
      },
    });
  }

  return (
    <>
    <div
      className={cn(
        "w-full rounded-2xl border border-white/30 bg-card/95 p-4 shadow-[var(--shadow-float)] backdrop-blur-xl sm:p-5",
        className,
      )}
    >
      {/* Direction — compact segmented tabs, the same familiar shape as a
          One-way / Round-trip switch, mapped onto GoAir's real fork: heading
          to the airport vs. arriving at it (GoAir only ever sells a
          single-direction transfer). */}
      <div className="mb-4 inline-flex rounded-xl bg-secondary p-1">
        <button
          type="button"
          onClick={() => selectDirection("to_airport")}
          aria-pressed={isDeparting}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
            isDeparting
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          <PlaneTakeoff className="size-4 shrink-0" aria-hidden />
          {t("searchWidget.directionToAirport.title")}
        </button>
        <button
          type="button"
          onClick={() => selectDirection("from_airport")}
          aria-pressed={!isDeparting}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
            !isDeparting
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          <PlaneLanding className="size-4 shrink-0" aria-hidden />
          {t("searchWidget.directionFromAirport.title")}
        </button>
      </div>

      {/* Fields — a single wide row on desktop (country, the two location
          fields, date, seats, submit), stacking to one column on mobile.
          This is the layout change: previously a narrow stacked card, now a
          full-width horizontal bar. */}
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1.3fr_1fr_0.8fr_auto] lg:items-end lg:gap-3"
      >
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Globe2 className="size-3.5 text-muted-foreground" />
            {t("searchWidget.countryLabel")}
          </Label>
          <Select
            value={country}
            onValueChange={(value) => {
              setCountry(value);
              setAirport("");
              setDestination("");
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("searchWidget.countryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((item) => (
                <SelectItem key={item} value={item}>
                  {getCountryLabel(item, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isDeparting ? (
          <>
            <SearchCombobox
              label={t("searchWidget.departureLocationLabel")}
              placeholder={t("searchWidget.departureLocationPlaceholder")}
              emptyText={t("searchWidget.departureLocationEmpty")}
              options={destinationOptions}
              value={destination}
              onChange={(value) => {
                setDestination(value);
                setAirport("");
              }}
              disabled={!country}
            />

            <SearchCombobox
              label={t("searchWidget.departureAirportLabel")}
              placeholder={t("searchWidget.departureAirportPlaceholder")}
              emptyText={t("searchWidget.departureAirportEmpty")}
              options={airportOptions}
              value={airport}
              onChange={setAirport}
              disabled={!destination}
            />
          </>
        ) : (
          <>
            <SearchCombobox
              label={t("searchWidget.arrivalAirportLabel")}
              placeholder={t("searchWidget.arrivalAirportPlaceholder")}
              emptyText={t("searchWidget.arrivalAirportEmpty")}
              options={airportOptions}
              value={airport}
              onChange={(value) => {
                setAirport(value);
                setDestination("");
              }}
              disabled={!country}
            />

            <SearchCombobox
              label={t("searchWidget.arrivalDestinationLabel")}
              placeholder={t("searchWidget.arrivalDestinationPlaceholder")}
              emptyText={t("searchWidget.arrivalDestinationEmpty")}
              options={destinationOptions}
              value={destination}
              onChange={setDestination}
              disabled={!country || (!airport && airportOptions.length > 0)}
            />
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="goair-date" className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            {isDeparting
              ? t("searchWidget.dateLabelToAirport")
              : t("searchWidget.dateLabelFromAirport")}
          </Label>
          <Input
            id="goair-date"
            type="date"
            min={today()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goair-seats" className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            {t("searchWidget.seatsLabel")}
          </Label>
          <Input
            id="goair-seats"
            type="number"
            min={1}
            max={50}
            value={seats}
            onChange={(event) => setSeats(Math.max(1, Number(event.target.value) || 1))}
            className="h-11"
          />
        </div>

        <div>
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 lg:w-auto lg:px-6"
          >
            <Search className="size-5" aria-hidden />
            {t("searchWidget.submit")}
          </Button>
        </div>
      </form>

      {/* Flight number — optional, so it stays a one-line link instead of a
          permanent grid cell that pushes the whole bar taller. */}
      {showFlightField ? (
        <div className="mt-3 max-w-sm space-y-2">
          <Label htmlFor="goair-flight" className="flex items-center gap-1.5">
            <PlaneTakeoff className="size-3.5 text-muted-foreground" />
            {t("searchWidget.flightNumberLabel")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("searchWidget.flightNumberOptional")}
            </span>
          </Label>
          <Input
            id="goair-flight"
            type="text"
            placeholder={t("searchWidget.flightNumberPlaceholder")}
            value={flight}
            onChange={(event) => setFlight(event.target.value)}
            className="h-11"
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowFlightField(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-accent"
        >
          <PlaneTakeoff className="size-3.5" />
          {t("searchWidget.addFlightNumber")}
        </button>
      )}
    </div>

    {quickRoutes.length > 0 ? (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          {t("searchWidget.tryLabel")}
        </span>
        {quickRoutes.map((trip) => (
          <button
            key={trip.id}
            type="button"
            onClick={() =>
              navigate({
                to: "/search",
                search: {
                  country: trip.country,
                  airport: trip.airport_code,
                  destination: trip.destination,
                  date,
                  seats,
                  direction: "from_airport",
                },
              })
            }
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            {localize(trip.origin, trip.origin_en, language)} ← {localize(trip.destination, trip.destination_en, language)}
          </button>
        ))}
      </div>
    ) : null}
    </>
  );
}
