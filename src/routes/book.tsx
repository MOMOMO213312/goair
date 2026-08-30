import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BookingBackLink } from "@/components/goair/booking/booking-back-link";
import { BookingHeader } from "@/components/goair/booking/booking-header";
import { BookingMobileCta } from "@/components/goair/booking/booking-mobile-cta";
import { BookingPassengerForm } from "@/components/goair/booking/booking-passenger-form";
import { BookingPriceSummary } from "@/components/goair/booking/booking-price-summary";
import { BookingTripSummary } from "@/components/goair/booking/booking-trip-summary";
import { createBookingSafe, fetchTrips, friendlyErrorMessage } from "@/lib/goair";

const FORM_ID = "goair-booking-form";

type BookSearch = {
  tripId: string;
  scheduleId: string;
  tripOptionId: string;
  date: string;
  seats: number;
  time: string;
  price: number;
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
  }),
  head: () => ({
    meta: [
      { title: "إتمام الحجز — GoAir" },
      {
        name: "description",
        content: "أدخل بيانات المسافرين لإتمام حجز مقعدك في النقل المشترك من المطار.",
      },
      { property: "og:title", content: "إتمام الحجز — GoAir" },
      { property: "og:description", content: "خطوة واحدة تفصلك عن تأكيد مقعدك." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [flight, setFlight] = useState("");
  const [luggage, setLuggage] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const trip = tripsQuery.data?.find((item) => item.id === search.tripId);

  const total = search.price * search.seats;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error("اكتب الاسم بالكامل.");
      return;
    }
    if (phone.trim().length < 7) {
      toast.error("اكتب رقم موبايل صحيح.");
      return;
    }

    setBusy(true);
    try {
      const { ticketCode } = await createBookingSafe({
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
      });
      toast.success("تم تثبيت مقعدك — باقي الدفع.");
      navigate({ to: "/payment", search: { ticket: ticketCode } });
    } catch (error) {
      toast.error(
        friendlyErrorMessage(error, "لم نتمكن من إنشاء الحجز. حاول مرة أخرى أو تواصل مع الدعم."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-mist/30 pb-28 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <BookingBackLink trip={trip} date={search.date} seats={search.seats} />

        <div className="mt-4">
          <BookingHeader />
        </div>

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
          {/* Main: passenger form */}
          <div className="min-w-0 space-y-6">
            <BookingPassengerForm
              formId={FORM_ID}
              seats={search.seats}
              fullName={fullName}
              phone={phone}
              flight={flight}
              luggage={luggage}
              notes={notes}
              busy={busy}
              onFullNameChange={setFullName}
              onPhoneChange={setPhone}
              onFlightChange={setFlight}
              onLuggageChange={setLuggage}
              onNotesChange={setNotes}
              onSubmit={onSubmit}
            />

            {/* Mobile price summary */}
            <div className="lg:hidden">
              <BookingPriceSummary
                seats={search.seats}
                pricePerSeat={search.price}
                total={total}
              />
            </div>
          </div>

          {/* Sidebar: trip + price (desktop) */}
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
              />
              <button
                type="submit"
                form={FORM_ID}
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-md bg-accent text-base font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? "جاري تجهيز الحجز..." : "متابعة الحجز"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <BookingMobileCta formId={FORM_ID} total={total} busy={busy} />
    </div>
  );
}
