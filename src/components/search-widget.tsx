import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Globe2, MapPin, Plane, Search, Users } from "lucide-react";
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
  getDestinationsForAirport,
} from "@/lib/trip-stats";
import { cn } from "@/lib/utils";

function today() {
  return new Date().toISOString().slice(0, 10);
}

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
  };
  className?: string;
}) {
  const navigate = useNavigate();
  const [country, setCountry] = useState(initial?.country ?? countries[0] ?? "");
  const [airport, setAirport] = useState(initial?.airport ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [seats, setSeats] = useState(initial?.seats ?? 1);

  const visibleTrips = useMemo(
    () => trips.filter((trip) => countries.includes(trip.country)),
    [trips, countries],
  );

  const airports = useMemo(
    () => getAirportsForCountry(visibleTrips, country),
    [visibleTrips, country],
  );

  const destinations = useMemo(
    () =>
      airport
        ? getDestinationsForAirport(visibleTrips, country, airport)
        : Array.from(
            new Set(
              visibleTrips.filter((trip) => trip.country === country).map((trip) => trip.destination),
            ),
          ).sort((a, b) => a.localeCompare(b, "ar")),
    [visibleTrips, country, airport],
  );

  useEffect(() => {
    if (!country && countries[0]) setCountry(countries[0]);
  }, [country, countries]);

  useEffect(() => {
    if (!airport && airports[0]?.code) setAirport(airports[0].code);
  }, [airport, airports]);

  const airportOptions = useMemo(
    () =>
      airports.map((item) => ({
        value: item.code,
        label: item.name,
        hint: item.code,
      })),
    [airports],
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!country || !destination) {
      toast.error("اختار البلد والوجهة الأول.");
      return;
    }
    navigate({
      to: "/search",
      search: {
        country,
        airport: airport || airports[0]?.code || "",
        destination,
        date,
        seats,
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
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-2xl border border-primary-foreground/10 bg-card p-4 shadow-[var(--shadow-float)] sm:p-6",
        className,
      )}
    >
      <p className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-primary">
        <Search className="size-4 text-accent" />
        ابحث عن رحلة المطار
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <SearchCombobox
          label="المطار"
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
          label="الوجهة"
          placeholder="رايح فين؟"
          emptyText="اختار المطار أولاً."
          options={destinationOptions}
          value={destination}
          onChange={setDestination}
          disabled={!country || (!airport && airportOptions.length > 0)}
        />

        <div className="space-y-2">
          <Label htmlFor="goair-date" className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            تاريخ السفر
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
            عدد المقاعد
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

        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Plane className="size-5 -rotate-45" />
            ابحث عن رحلتك
          </Button>
        </div>
      </div>
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
                search: { country: trip.country, airport: trip.airport_code, destination: trip.destination, date, seats, ...(packageId ? { packageId } : {}) },
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
