import { Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import {
  bookingField,
  extractDepartureTime,
} from "@/components/goair/confirmation/confirmation-utils";
import { ConfirmationStatusBadge } from "@/components/goair/confirmation/confirmation-status-badge";
import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { formatSearchDate } from "@/components/goair/search/search-summary";
import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingRecord, Trip } from "@/lib/goair";
import { formatTime, formatUsd } from "@/lib/goair";
import { getRouteImageFromTripOrFallback, getTripCityLocation } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

type ConfirmationTicketCardProps = {
  booking: BookingRecord;
  trip: Trip | undefined;
  ticket: string;
  className?: string;
};

export function ConfirmationTicketCard({
  booking,
  trip,
  ticket,
  className,
}: ConfirmationTicketCardProps) {
  const travelDate = bookingField(booking, ["travel_date"]);
  const departureRaw = extractDepartureTime(booking);
  const seats = Number(booking.seats_count ?? 1);
  const total = booking.expected_total_usd ? formatUsd(Number(booking.expected_total_usd)) : "—";
  const passengerName = bookingField(booking, ["full_name"]);

  const originLabel = trip?.airport_name ?? trip?.origin ?? bookingField(booking, ["origin", "airport_name"]);
  const destLabel = trip?.destination ?? bookingField(booking, ["destination"]);
  const airportCode = trip?.airport_code ?? bookingField(booking, ["airport_code"]);
  const country = trip?.country ?? bookingField(booking, ["country"]);
  const image = getRouteImageFromTripOrFallback(trip, {
    origin: trip?.origin ?? bookingField(booking, ["origin"]),
    destination: destLabel,
    airport_name: trip?.airport_name ?? bookingField(booking, ["airport_name"]),
    airport_code: airportCode,
    country,
  });
  const cityLabel = trip ? getTripCityLocation(trip) : destLabel;

  return (
    <Card
      className={cn(
        "confirmation-ticket overflow-hidden rounded-2xl border-border/80 p-0 shadow-[var(--shadow-float)]",
        className,
      )}
    >
      {/* Ticket header */}
      <div className="relative bg-primary px-5 py-6 text-primary-foreground sm:px-6">
        {image ? (
          <img
            src={image}
            alt=""
            width={640}
            height={120}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-20"
          />
        ) : null}
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">GoAir</p>
              <p className="mt-1 text-xs opacity-80">رقم الحجز</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-display text-2xl font-extrabold tracking-[0.15em] sm:text-3xl">
                  {ticket}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
                  aria-label="نسخ رقم الحجز"
                  onClick={() => {
                    void navigator.clipboard.writeText(ticket);
                    toast.success("تم نسخ رقم الحجز");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <ConfirmationStatusBadge booking={booking} />
          </div>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative h-4 bg-mist">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
        <div className="absolute -start-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-mist" />
        <div className="absolute -end-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-mist" />
      </div>

      {/* Route visual */}
      <div className="bg-card px-5 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">من</p>
            <p className="mt-1 font-display text-lg font-extrabold text-primary">
              {airportCode || "—"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{originLabel || "—"}</p>
          </div>

          <div className="relative min-w-0 flex-1 px-2">
            <FlightPath className="mx-auto h-10 w-full max-w-[10rem] text-accent" />
          </div>

          <div className="min-w-0 text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">إلى</p>
            <p className="mt-1 truncate font-display text-lg font-extrabold text-primary">
              {destLabel || "—"}
            </p>
          </div>
        </div>

        {!image && cityLabel ? (
          <DestinationPlaceholder
            destination={cityLabel}
            className="mt-4 h-20 rounded-lg sm:h-24"
          />
        ) : null}

        {/* Trip grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-5">
          <TicketCell label="التاريخ" value={travelDate ? formatSearchDate(travelDate) : "—"} />
          <TicketCell
            label="موعد المغادرة"
            value={departureRaw ? formatTime(departureRaw) || departureRaw : "—"}
          />
          <TicketCell
            label="المسافرون"
            value={`${seats} ${seats === 1 ? "مقعد" : "مقاعد"}`}
          />
          <TicketCell label="الإجمالي" value={total} highlight />
        </div>

        {passengerName ? (
          <div className="mt-4 rounded-lg bg-secondary/40 px-4 py-3">
            <p className="text-[10px] font-bold text-muted-foreground">اسم المسافر</p>
            <p className="mt-1 font-display font-bold text-primary">{passengerName}</p>
          </div>
        ) : null}

        {/* QR */}
        <div className="mt-6 flex flex-col items-center">
          <div
            className="rounded-xl bg-white p-4 ring-1 ring-border"
            role="img"
            aria-label={`رمز QR للحجز ${ticket}`}
          >
            <QRCode value={ticket || "GOAIR"} size={160} />
          </div>
          <p className="mt-3 max-w-xs text-center text-xs text-muted-foreground">
            اعرض هذا الرمز عند الحاجة إلى إثبات الحجز
          </p>
        </div>
      </div>
    </Card>
  );
}

function TicketCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-sm font-bold sm:text-base",
          highlight ? "text-accent" : "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
