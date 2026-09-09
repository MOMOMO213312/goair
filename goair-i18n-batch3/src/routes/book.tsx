import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BookingAddonsStep } from "@/components/goair/booking/booking-addons-step";
import { BookingBackLink } from "@/components/goair/booking/booking-back-link";
import { BookingConfirmStep } from "@/components/goair/booking/booking-confirm-step";
import { BookingExtrasStep } from "@/components/goair/booking/booking-extras-step";
import { BookingHeader } from "@/components/goair/booking/booking-header";
import { BookingPassengersStep } from "@/components/goair/booking/booking-passengers-step";
import { BookingPriceSummary } from "@/components/goair/booking/booking-price-summary";
import { BookingStepper, type BookingStepId } from "@/components/goair/booking/booking-stepper";
import { BookingTripSummary } from "@/components/goair/booking/booking-trip-summary";
import { BookingTrustPanel } from "@/components/goair/booking/booking-trust-panel";
import {
  createBookingSafe,
  createPrivateBookingSafe,
  fetchAddonServices,
  fetchTrips,
  friendlyErrorMessage,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].bookPage.meta;

type BookSearch = {
  tripId: string;
  scheduleId: string;
  tripOptionId: string;
  date: string;
  seats: number;
  time: string;
  price: number;
  /** 'private' = whole-vehicle charter (flat price); default 'shared' = per-seat, unchanged. */
  bookingType: "shared" | "private";
  /** Required when bookingType === 'private' — which vehicle tier was picked. */
  vehicleTypeId?: string | undefined;
  /** Prefilled from the hero search, if entered — no live tracking, just carried through. */
  flight?: string | undefined;
};

/** Wizard phase — mirrors booking steps 2 (Extras), 3 (Passengers+Transfers) and 4 (Confirmation). */
type Phase = "extras" | "passengers" | "confirm";

const PHASE_TO_STEP: Record<Phase, BookingStepId> = {
  extras: 2,
  passengers: 3,
  confirm: 4,
};

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    tripId: String(search["tripId"] ?? ""),
    scheduleId: String(search["scheduleId"] ?? ""),
    tripOptionId: String(search["tripOptionId"] ?? ""),
    date: String(search["date"] ?? ""),
    seats: Math.max(1, Number(search["seats"]) || 1),
    time: String(search["time"] ?? ""),
    price: Number(search["price"]) || 0,
    bookingType: search["bookingType"] === "private" ? "private" : "shared",
    vehicleTypeId: typeof search["vehicleTypeId"] === "string" ? search["vehicleTypeId"] : undefined,
    flight: typeof search["flight"] === "string" && search["flight"] ? search["flight"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: pageMeta.title },
      {
        name: "description",
        content: pageMeta.description,
      },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { t, language } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("extras");
  const [luggage, setLuggage] = useState(1);
  const [extrasNotes, setExtrasNotes] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [flight, setFlight] = useState(search.flight ?? "");
  const [busy, setBusy] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const trip = tripsQuery.data?.find((item) => item.id === search.tripId);

  const addonsQuery = useQuery({ queryKey: ["goair", "addon-services"], queryFn: fetchAddonServices });
  const selectedAddons = (addonsQuery.data ?? []).filter((a) => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.priceUsd, 0);

  function toggleAddon(id: string) {
    setSelectedAddonIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  const isPrivate = search.bookingType === "private";
  const rideTotal = isPrivate ? search.price : search.price * search.seats;
  const total = rideTotal + addonsTotal;

  async function onConfirm() {
    if (fullName.trim().length < 3) {
      toast.error(t("bookPage.fullNameRequired"));
      setPhase("passengers");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error(t("bookPage.invalidPhone"));
      setPhase("passengers");
      return;
    }
    if (isPrivate && !search.vehicleTypeId) {
      toast.error(t("bookPage.vehicleTypeMissing"));
      return;
    }

    setBusy(true);
    try {
      const { ticketCode } = isPrivate
        ? await createPrivateBookingSafe({
            tripId: search.tripId,
            vehicleTypeId: search.vehicleTypeId!,
            travelDate: search.date,
            travelDatetime: search.time ? `${search.date}T${search.time}` : null,
            seatsCount: search.seats,
            fullName: fullName.trim(),
            phoneNumber: phone.trim(),
            flightNumber: flight.trim() || null,
            luggageCount: luggage,
            addonIds: selectedAddonIds,
          })
        : await createBookingSafe({
            tripId: search.tripId,
            scheduleId: search.scheduleId,
            tripOptionId: search.tripOptionId || null,
            travelDate: search.date,
            travelDatetime: search.time ? `${search.date}T${search.time}` : null,
            departureTime: search.time.slice(0, 5),
            seatsCount: search.seats,
            fullName: fullName.trim(),
            phoneNumber: phone.trim(),
            flightNumber: flight.trim() || null,
            luggageCount: luggage,
            addonIds: selectedAddonIds,
          });
      toast.success(isPrivate ? t("bookPage.privateBookingConfirmed") : t("bookPage.seatConfirmed"));
      navigate({ to: "/payment", search: { ticket: ticketCode } });
    } catch (error) {
      toast.error(
        friendlyErrorMessage(error, t("bookPage.bookingCreateError")),
      );
    } finally {
      setBusy(false);
    }
  }

  function onPassengersSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error(t("bookPage.fullNameRequired"));
      return;
    }
    if (phone.trim().length < 7) {
      toast.error(t("bookPage.invalidPhone"));
      return;
    }
    setPhase("confirm");
  }

  return (
    <div className="bg-mist/30 pb-16 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <BookingBackLink trip={trip} date={search.date} seats={search.seats} />

        <div className="mt-4">
          <BookingHeader />
        </div>

        <BookingStepper current={PHASE_TO_STEP[phase]} className="mt-6" />

        {/* Mobile: trip summary first */}
        <div className="mt-6 lg:hidden">
          <BookingTripSummary
            trip={trip}
            date={search.date}
            time={search.time}
            seats={search.seats}
            scheduleId={search.scheduleId}
          />
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main: current step */}
          <div className="min-w-0 space-y-6">
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
                seats={search.seats}
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
                addonNames={selectedAddons.map((a) => localize(a.name, a.nameEn, language))}
                onEditExtras={() => setPhase("extras")}
                onEditPassengers={() => setPhase("passengers")}
                onConfirm={onConfirm}
                busy={busy}
              />
            ) : null}

            {/* Mobile price summary */}
            <div className="lg:hidden">
              <BookingPriceSummary
                seats={search.seats}
                pricePerSeat={search.price}
                total={total}
                isPrivate={isPrivate}
                addonsTotal={addonsTotal}
              />
            </div>
          </div>

          {/* Sidebar: trip + price + trust (desktop) */}
          <aside className="hidden space-y-5 lg:block">
            <div className="sticky top-20 space-y-5">
              <BookingTripSummary
                trip={trip}
                date={search.date}
                time={search.time}
                seats={search.seats}
                scheduleId={search.scheduleId}
              />
              <BookingPriceSummary
                seats={search.seats}
                pricePerSeat={search.price}
                total={total}
                isPrivate={isPrivate}
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
