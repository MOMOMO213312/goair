import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Car, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRentalBookingSafe,
  fetchAvailableRentalVehicles,
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

  const vehiclesQuery = useQuery({
    queryKey: ["goair", "rental-vehicles"],
    queryFn: () => fetchAvailableRentalVehicles(),
  });

  const [phase, setPhase] = useState<Phase>("browse");
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);

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

  return (
    <div className="goair-section">
      <div className="goair-container max-w-4xl">
        {phase === "browse" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
              {t("rentACarPage.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("rentACarPage.subtitle")}</p>

            {vehiclesQuery.isPending ? (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                {t("rentACarPage.loading")}
              </p>
            ) : !vehiclesQuery.data || vehiclesQuery.data.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                {t("rentACarPage.empty")}
              </p>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {vehiclesQuery.data.map((vehicle) => (
                  <RentalVehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    language={language}
                    onSelect={() => onSelectVehicle(vehicle)}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}

        {phase === "book" && selectedVehicle ? (
          <BookingForm
            vehicle={selectedVehicle}
            language={language}
            onBack={() => setPhase("browse")}
            onDone={onBookingDone}
          />
        ) : null}

        {phase === "confirm" ? (
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
        ) : null}
      </div>
    </div>
  );
}

function RentalVehiclePhoto({ vehicle }: { vehicle: RentalVehicle }) {
  const photo = vehicle.photos[0];
  if (photo) {
    return (
      <img
        src={photo}
        alt={vehicle.makeModel}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover"
      />
    );
  }
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-secondary to-mist">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Car className="size-5" />
      </span>
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

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <RentalVehiclePhoto vehicle={vehicle} />
      <div className="flex flex-1 flex-col p-5">
        {categoryLabel ? (
          <span className="mb-2 inline-flex w-fit items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">
            {categoryLabel}
          </span>
        ) : null}
        <h3 className="font-display text-lg font-extrabold text-primary">{vehicle.makeModel}</h3>
        {vehicle.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{vehicle.description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {vehicle.hourlyRateUsd != null ? (
            <span className="text-sm font-bold text-accent">
              {formatUsd(vehicle.hourlyRateUsd)}
              <span className="text-xs font-medium text-muted-foreground">
                {t("rentACarPage.perHour")}
              </span>
            </span>
          ) : null}
          <span className="text-sm font-bold text-accent">
            {formatUsd(vehicle.dailyRateUsd)}
            <span className="text-xs font-medium text-muted-foreground">
              {t("rentACarPage.perDay")}
            </span>
          </span>
          {vehicle.multiDayRateUsd != null ? (
            <span className="text-sm font-bold text-accent">
              {formatUsd(vehicle.multiDayRateUsd)}
              <span className="text-xs font-medium text-muted-foreground">
                {t("rentACarPage.perMultiDay")}
              </span>
            </span>
          ) : null}
        </div>

        <Button
          className="mt-5 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
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
