import { Info, Loader2, Luggage, Phone, Plane, User } from "lucide-react";

import { BookingCancellationNote } from "@/components/goair/booking/booking-cancellation-note";
import { BookingTrustNote } from "@/components/goair/booking/booking-trust-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type BookingPassengerFormProps = {
  formId: string;
  seats: number;
  fullName: string;
  phone: string;
  flight: string;
  luggage: number;
  notes: string;
  busy: boolean;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onFlightChange: (value: string) => void;
  onLuggageChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  showSubmitButton?: boolean;
  className?: string;
};

export function BookingPassengerForm({
  formId,
  seats,
  fullName,
  phone,
  flight,
  luggage,
  notes,
  busy,
  onFullNameChange,
  onPhoneChange,
  onFlightChange,
  onLuggageChange,
  onNotesChange,
  onSubmit,
  showSubmitButton = true,
  className,
}: BookingPassengerFormProps) {
  const { t } = useTranslation();
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{t("booking.passengerForm.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("booking.passengerForm.subtitle")}
      </p>

      <form id={formId} onSubmit={onSubmit} className="mt-6 space-y-6">
        {/* Passenger 1 — contact (only fields sent to backend) */}
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-bold text-primary">
            {t("booking.passengerForm.passenger1")}
            <span className="ms-2 text-xs font-medium text-muted-foreground">{t("booking.passengerForm.contact")}</span>
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">
                {t("booking.passengerForm.fullName")} <span className="text-accent">*</span>
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="name"
                  value={fullName}
                  onChange={(event) => onFullNameChange(event.target.value)}
                  className="h-11 ps-10"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium">
                {t("booking.passengerForm.mobileWhatsapp")} <span className="text-accent">*</span>
              </Label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => onPhoneChange(event.target.value)}
                  placeholder="+20 1XX XXX XXXX"
                  className="h-11 ps-10"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Additional seats — informational only (payload unchanged) */}
        {seats > 1 ? (
          <div className="space-y-2">
            {Array.from({ length: seats - 1 }, (_, index) => (
              <div
                key={index + 2}
                className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-3"
              >
                <p className="font-display text-sm font-bold text-primary">{t("booking.passengerForm.additionalPassenger", { number: index + 2 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("booking.passengerForm.additionalSeatNote")}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Trip details */}
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-bold text-primary">{t("booking.passengerForm.tripDetails")}</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flight" className="font-medium">
                {t("booking.passengerForm.flightNumber")} <span className="text-xs text-muted-foreground">{t("booking.passengerForm.optional")}</span>
              </Label>
              <div className="relative">
                <Plane
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="flight"
                  value={flight}
                  onChange={(event) => onFlightChange(event.target.value.toUpperCase())}
                  placeholder="MS 706"
                  className="h-11 ps-10"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("booking.passengerForm.flightHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="luggage" className="font-medium">
                {t("booking.passengerForm.luggageCount")}
              </Label>
              <div className="relative">
                <Luggage
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="luggage"
                  type="number"
                  min={0}
                  max={20}
                  value={luggage}
                  onChange={(event) =>
                    onLuggageChange(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="h-11 ps-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-medium">
              {t("booking.passengerForm.notes")} <span className="text-xs text-muted-foreground">{t("booking.passengerForm.optional")}</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder={t("booking.passengerForm.notesPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>
        </fieldset>

        <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>
            {t("booking.passengerForm.flightWaitNote")}
          </span>
        </div>

        <BookingCancellationNote />
        <BookingTrustNote />

        {showSubmitButton ? (
          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="hidden h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 md:flex lg:hidden"
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                {t("booking.passengerForm.preparing")}
              </>
            ) : (
              t("booking.passengerForm.continueButton")
            )}
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
