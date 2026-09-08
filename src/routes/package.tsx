import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { BookingAddonsStep } from "@/components/goair/booking/booking-addons-step";
import { BookingConfirmStep } from "@/components/goair/booking/booking-confirm-step";
import { BookingExtrasStep } from "@/components/goair/booking/booking-extras-step";
import { BookingPassengersStep } from "@/components/goair/booking/booking-passengers-step";
import { BookingPriceSummary } from "@/components/goair/booking/booking-price-summary";
import { BookingStepper, type BookingStepId } from "@/components/goair/booking/booking-stepper";
import { BookingTrustPanel } from "@/components/goair/booking/booking-trust-panel";
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
  createBookingSafe,
  fetchAddonServices,
  fetchPackageById,
  fetchScheduleOptions,
  fetchTrips,
  fetchVisibleCountries,
  formatTime,
  formatUsd,
  friendlyErrorMessage,
} from "@/lib/goair";
import { filterPublicTrips, getAirportsForCountry, getDestinationsForAirport } from "@/lib/trip-stats";
import { cn } from "@/lib/utils";

type PackageSearch = { packageId: string };

/**
 * A package is its OWN product with its own funnel — it must never again be
 * threaded through the normal ride search/booking pages (/search, /book) as
 * a side param. This route owns every step end to end: package details →
 * pick the linked trip/date/passengers → optional extra services → passenger
 * details → review → payment. Only the final booking write (createBookingSafe)
 * is shared with the normal flow, since that's the DB contract either way.
 */
type Phase = "trip" | "extras" | "passengers" | "confirm";

const PHASE_TO_STEP: Record<Phase, BookingStepId> = {
  trip: 1,
  extras: 2,
  passengers: 3,
  confirm: 4,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const Route = createFileRoute("/package")({
  validateSearch: (search: Record<string, unknown>): PackageSearch => ({
    packageId: String(search["packageId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "حجز الباقة — GoAir" },
      {
        name: "description",
        content: "اختار رحلتك واستكمل حجز باقتك في خطوات مستقلة تمامًا عن الحجز العادي.",
      },
    ],
  }),
  component: PackagePage,
});

function PackagePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const packageQuery = useQuery({
    queryKey: ["goair", "package", search.packageId],
    queryFn: () => fetchPackageById(search.packageId),
    enabled: Boolean(search.packageId),
  });
  const pkg = packageQuery.data;

  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const countriesQuery = useQuery({
    queryKey: ["goair", "visible-countries", tripsQuery.dataUpdatedAt],
    queryFn: () => fetchVisibleCountries(tripsQuery.data ?? []),
    enabled: Boolean(tripsQuery.data),
  });

  const [phase, setPhase] = useState<Phase>("trip");
  const [country, setCountry] = useState("");
  const [airport, setAirport] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today());
  const [seats, setSeats] = useState(1);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [hasSearchedTimes, setHasSearchedTimes] = useState(false);

  const [luggage, setLuggage] = useState(1);
  const [extrasNotes, setExtrasNotes] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [flight, setFlight] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const visibleTrips = useMemo(
    () => filterPublicTrips(tripsQuery.data ?? [], countriesQuery.data ?? []),
    [tripsQuery.data, countriesQuery.data],
  );

  useEffect(() => {
    if (!country && countriesQuery.data?.[0]) setCountry(countriesQuery.data[0]);
  }, [country, countriesQuery.data]);

  const airports = useMemo(() => getAirportsForCountry(visibleTrips, country), [visibleTrips, country]);
  const destinations = useMemo(
    () => (airport ? getDestinationsForAirport(visibleTrips, country, airport) : []),
    [visibleTrips, country, airport],
  );

  const trip = visibleTrips.find(
    (item) =>
      item.country === country && item.airport_code === airport && item.destination === destination,
  );

  const scheduleQuery = useQuery({
    queryKey: ["goair", "schedules", trip?.id, date],
    queryFn: () => fetchScheduleOptions(trip!.id, date, trip!),
    enabled: Boolean(trip) && hasSearchedTimes,
  });

  const timeOptions = scheduleQuery.data ?? [];
  const selectedOption = timeOptions.find((option) => option.scheduleId === selectedScheduleId);

  const addonsQuery = useQuery({ queryKey: ["goair", "addon-services"], queryFn: fetchAddonServices });
  const selectedAddons = (addonsQuery.data ?? []).filter((a) => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.priceUsd, 0);

  // A package's price already includes the transport — it's a complete
  // product, always the per-seat basis here (never the trip's raw seat price).
  const packagePricePerSeat = pkg?.priceUsd ?? 0;
  const total = packagePricePerSeat * seats + addonsTotal;

  function toggleAddon(id: string) {
    setSelectedAddonIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  function onSearchTimes(event: React.FormEvent) {
    event.preventDefault();
    if (!country || !airport || !destination) {
      toast.error("اختار المطار والوجهة الأول.");
      return;
    }
    setSelectedScheduleId(null);
    setHasSearchedTimes(true);
  }

  function onContinueFromTrip() {
    if (!selectedOption) {
      toast.error("اختار معاد الرحلة الأول.");
      return;
    }
    setPhase("extras");
  }

  function onPassengersSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error("اكتب الاسم بالكامل.");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("اكتب رقم موبايل صحيح.");
      return;
    }
    setPhase("confirm");
  }

  async function onConfirm() {
    if (!trip || !selectedOption) {
      toast.error("لازم تختار رحلتك الأول.");
      setPhase("trip");
      return;
    }
    if (fullName.trim().length < 3) {
      toast.error("اكتب الاسم بالكامل.");
      setPhase("passengers");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("اكتب رقم موبايل صحيح.");
      setPhase("passengers");
      return;
    }

    setBusy(true);
    try {
      const { ticketCode } = await createBookingSafe({
        tripId: trip.id,
        scheduleId: selectedOption.scheduleId,
        tripOptionId: selectedOption.tripOptionId ?? "",
        travelDate: date,
        travelDatetime: selectedOption.departureTime ? `${date}T${selectedOption.departureTime}` : null,
        departureTime: selectedOption.departureTime.slice(0, 5),
        seatsCount: seats,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        flightNumber: flight.trim() || null,
        luggageCount: luggage,
        packageId: pkg?.id ?? null,
        addonIds: selectedAddonIds,
      });
      toast.success("تم تثبيت حجز الباقة — باقي الدفع.");
      navigate({ to: "/payment", search: { ticket: ticketCode } });
    } catch (error) {
      toast.error(
        friendlyErrorMessage(error, "لم نتمكن من إنشاء حجز الباقة. حاول مرة أخرى أو تواصل مع الدعم."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!search.packageId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-lg font-bold text-primary">مفيش باقة محددة</p>
        <p className="mt-2 text-sm text-muted-foreground">ارجع لصفحة الباقات واختار باقة الأول.</p>
        <Button asChild className="mt-6">
          <Link to="/explore" search={{ tab: "packages" }}>
            عرض الباقات
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-mist/30 pb-16 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <Link
          to="/explore"
          search={{ tab: "packages" }}
          className="text-sm font-bold text-accent hover:underline"
        >
          ← رجوع للباقات
        </Link>

        <header className="mt-4 space-y-1">
          <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">حجز باقة</h1>
          <p className="text-sm text-muted-foreground">
            دي خطوات حجز الباقة — منفصلة تمامًا عن حجز الرحلة العادي.
          </p>
        </header>

        <BookingStepper current={PHASE_TO_STEP[phase]} className="mt-6" />

        <Card className="mt-6 border-accent/30 bg-accent/5 p-5">
          {packageQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">جارِ تحميل بيانات الباقة...</p>
          ) : pkg ? (
            <>
              <p className="font-display text-lg font-extrabold text-primary">{pkg.name}</p>
              {pkg.tagline ? <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p> : null}
              {pkg.features.length > 0 ? (
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="text-sm text-primary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 font-display text-xl font-extrabold text-accent">
                {formatUsd(pkg.priceUsd)} / راكب
              </p>
            </>
          ) : (
            <p className="text-sm text-destructive">تعذّر إيجاد هذه الباقة — ممكن تكون اتشالت.</p>
          )}
        </Card>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            {phase === "trip" ? (
              <Card className="border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
                <h2 className="font-display text-lg font-extrabold text-primary">اختار رحلتك</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  حدد المطار والوجهة والموعد اللي هتستخدم فيهم الباقة.
                </p>

                <form onSubmit={onSearchTimes} className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>الدولة</Label>
                    <Select
                      value={country}
                      onValueChange={(value) => {
                        setCountry(value);
                        setAirport("");
                        setDestination("");
                        setHasSearchedTimes(false);
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="اختار الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {(countriesQuery.data ?? []).map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المطار</Label>
                    <Select
                      value={airport}
                      onValueChange={(value) => {
                        setAirport(value);
                        setDestination("");
                        setHasSearchedTimes(false);
                      }}
                      disabled={!country}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="اختار المطار" />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الوجهة</Label>
                    <Select
                      value={destination}
                      onValueChange={(value) => {
                        setDestination(value);
                        setHasSearchedTimes(false);
                      }}
                      disabled={!airport}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="اختار الوجهة" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      className="mt-1.5"
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setHasSearchedTimes(false);
                      }}
                    />
                  </div>
                  <div>
                    <Label>عدد الركاب</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1.5"
                      value={seats}
                      onChange={(event) => setSeats(Math.max(1, Number(event.target.value) || 1))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      عرض المواعيد المتاحة
                    </Button>
                  </div>
                </form>

                {hasSearchedTimes ? (
                  <div className="mt-6">
                    {scheduleQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">جارِ تحميل المواعيد...</p>
                    ) : timeOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        مفيش مواعيد متاحة في التاريخ ده — جرّب تاريخ تاني.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-3">
                        {timeOptions.map((option) => (
                          <button
                            key={option.scheduleId}
                            type="button"
                            disabled={!option.isAvailable}
                            onClick={() => setSelectedScheduleId(option.scheduleId)}
                            className={cn(
                              "rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors",
                              option.scheduleId === selectedScheduleId
                                ? "border-accent bg-accent/10 text-primary"
                                : "border-border/80 text-muted-foreground hover:border-accent/50",
                              !option.isAvailable && "cursor-not-allowed opacity-50",
                            )}
                          >
                            {formatTime(option.departureTime)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <Button
                  type="button"
                  className="mt-6 w-full sm:w-auto"
                  onClick={onContinueFromTrip}
                  disabled={!selectedOption}
                >
                  متابعة
                </Button>
              </Card>
            ) : null}

            {phase === "extras" ? (
              <>
                <BookingExtrasStep
                  luggage={luggage}
                  onLuggageChange={setLuggage}
                  notes={extrasNotes}
                  onNotesChange={setExtrasNotes}
                  onContinue={() => setPhase("passengers")}
                />
                <BookingAddonsStep
                  addons={addonsQuery.data ?? []}
                  addonsLoading={addonsQuery.isLoading}
                  selectedAddonIds={selectedAddonIds}
                  onToggleAddon={toggleAddon}
                  className="mt-6"
                />
              </>
            ) : null}

            {phase === "passengers" ? (
              <BookingPassengersStep
                seats={seats}
                fullName={fullName}
                phone={phone}
                flight={flight}
                onFullNameChange={setFullName}
                onPhoneChange={setPhone}
                onFlightChange={setFlight}
                onBack={() => setPhase("extras")}
                onContinue={onPassengersSubmit}
              />
            ) : null}

            {phase === "confirm" ? (
              <BookingConfirmStep
                fullName={fullName}
                phone={phone}
                flight={flight}
                luggage={luggage}
                notes={extrasNotes}
                {...(pkg?.name ? { packageName: pkg.name } : {})}
                addonNames={selectedAddons.map((a) => a.name)}
                onEditExtras={() => setPhase("extras")}
                onEditPassengers={() => setPhase("passengers")}
                onConfirm={onConfirm}
                busy={busy}
              />
            ) : null}

            <div className="lg:hidden">
              <BookingPriceSummary
                seats={seats}
                pricePerSeat={packagePricePerSeat}
                total={total}
                {...(pkg?.name ? { packageName: pkg.name } : {})}
                addonsTotal={addonsTotal}
              />
            </div>
          </div>

          <aside className="hidden space-y-5 lg:block">
            <div className="sticky top-20 space-y-5">
              <BookingPriceSummary
                seats={seats}
                pricePerSeat={packagePricePerSeat}
                total={total}
                {...(pkg?.name ? { packageName: pkg.name } : {})}
                addonsTotal={addonsTotal}
              />
              <BookingTrustPanel />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
