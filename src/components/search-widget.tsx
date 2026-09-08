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
  packageId,
  className,
}: {
  trips: Trip[];
  countries: string[];
  packageId?: string;
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
    () => airportChoices.map((item) => ({ value: item.code, label: item.name, hint: item.code })),
    [airportChoices],
  );

  const destinationOptions = useMemo(
    () => destinations.map((item) => ({ value: item, label: item })),
    [destinations],
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
      toast.error(isDeparting ? "اختار مدينتك والمطار الأول." : "اختار المطار ووجهتك الأول.");
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
        ...(packageId ? { packageId } : {}),
      },
    });
  }

  return (
    <>
    {packageId ? (
      <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold text-primary">
        ✓ اخترت باقة إضافية — هتتضاف تلقائيًا لإجمالي حجزك
      </div>
    ) : null}

    {/* Direction — the first decision, as two big visual cards instead of a
        cramped One-way/Round-trip tab bar (GoAir only ever sells a
        single-direction airport transfer, so this is the real fork). */}
    <div className="mb-3 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => selectDirection("to_airport")}
        aria-pressed={isDeparting}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:flex-row sm:gap-3 sm:p-5 sm:text-right",
          isDeparting
            ? "border-accent bg-card shadow-[var(--shadow-float)]"
            : "border-white/30 bg-card/70 hover:border-accent/40",
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            isDeparting ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
          )}
        >
          <PlaneTakeoff className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block font-display text-base font-extrabold text-primary sm:text-lg">
            أنا مسافر
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">
            من موقعي إلى المطار
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => selectDirection("from_airport")}
        aria-pressed={!isDeparting}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:flex-row sm:gap-3 sm:p-5 sm:text-right",
          !isDeparting
            ? "border-accent bg-card shadow-[var(--shadow-float)]"
            : "border-white/30 bg-card/70 hover:border-accent/40",
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            !isDeparting ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
          )}
        >
          <PlaneLanding className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block font-display text-base font-extrabold text-primary sm:text-lg">
            أنا واصل
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">
            من المطار إلى وجهتي
          </span>
        </span>
      </button>
    </div>

    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-2xl border border-white/30 bg-card/85 p-4 shadow-[var(--shadow-float)] backdrop-blur-xl sm:p-5",
        className,
      )}
    >
      <p className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-primary">
        <Search className="size-4 text-accent" />
        {isDeparting ? "تفاصيل رحلتك للمطار" : "تفاصيل رحلتك من المطار"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Globe2 className="size-3.5 text-muted-foreground" />
            الدولة
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
              <SelectValue placeholder="اختار الدولة" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isDeparting ? (
          <>
            <SearchCombobox
              label="هتتحرك منين؟"
              placeholder="اكتب اسم منطقتك"
              emptyText="اختار الدولة أولاً."
              options={destinationOptions}
              value={destination}
              onChange={(value) => {
                setDestination(value);
                setAirport("");
              }}
              disabled={!country}
            />

            <SearchCombobox
              label="هتسافر من مطار إيه؟"
              placeholder="اختار المطار"
              emptyText="اختار منطقتك أولاً."
              options={airportOptions}
              value={airport}
              onChange={setAirport}
              disabled={!destination}
            />
          </>
        ) : (
          <>
            <SearchCombobox
              label="هتنزل مطار إيه؟"
              placeholder="اختار المطار"
              emptyText="لا يوجد مطار في هذه الدولة."
              options={airportOptions}
              value={airport}
              onChange={(value) => {
                setAirport(value);
                setDestination("");
              }}
              disabled={!country}
            />

            <SearchCombobox
              label="وجهتك بعد الوصول"
              placeholder="رايح فين؟"
              emptyText="اختار المطار أولاً."
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
            {isDeparting ? "تاريخ الرحلة" : "تاريخ الوصول"}
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
            عدد المسافرين
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

        <div className="flex items-end">
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Plane className={cn("size-5", isDeparting ? "rotate-45" : "-rotate-45")} aria-hidden />
            ابحث عن الرحلات
          </Button>
        </div>
      </div>

      {/* Flight number — optional, so it stays a one-line link instead of a
          permanent grid cell that pushes the whole widget taller. */}
      {showFlightField ? (
        <div className="mt-3 space-y-2">
          <Label htmlFor="goair-flight" className="flex items-center gap-1.5">
            <PlaneTakeoff className="size-3.5 text-muted-foreground" />
            رقم الرحلة <span className="font-normal text-muted-foreground">(اختياري)</span>
          </Label>
          <Input
            id="goair-flight"
            type="text"
            placeholder="مثال: MS777"
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
          + إضافة رقم الرحلة (اختياري)
        </button>
      )}
    </form>

    {quickRoutes.length > 0 ? (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">جرّب:</span>
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
                  ...(packageId ? { packageId } : {}),
                },
              })
            }
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-accent hover:text-accent"
          >
            {trip.origin} ← {trip.destination}
          </button>
        ))}
      </div>
    ) : null}
    </>
  );
}
