import { Info, Phone, Plane, User } from "lucide-react";

import { BookingTrustNote } from "@/components/goair/booking/booking-trust-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type BookingPassengersStepProps = {
  seats: number;
  fullName: string;
  phone: string;
  flight: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onFlightChange: (value: string) => void;
  onBack: () => void;
  onContinue: (event: React.FormEvent) => void;
  className?: string;
};

/** Step 3 — passenger contact details + flight (so the driver waits at arrivals). */
export function BookingPassengersStep({
  seats,
  fullName,
  phone,
  flight,
  onFullNameChange,
  onPhoneChange,
  onFlightChange,
  onBack,
  onContinue,
  className,
}: BookingPassengersStepProps) {
  const { t } = useTranslation();
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{t("booking.passengersStep.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("booking.passengerForm.subtitle")}
      </p>

      <form onSubmit={onContinue} className="mt-6 space-y-6">
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

        <fieldset className="space-y-2">
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
        </fieldset>

        <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>{t("booking.passengerForm.flightWaitNote")}</span>
        </div>

        <BookingTrustNote />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="h-12 flex-1 font-bold sm:flex-none sm:px-8"
          >
            {t("booking.passengersStep.back")}
          </Button>
          <Button
            type="submit"
            size="lg"
            className="h-12 flex-1 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
          >
            {t("booking.passengersStep.continueReview")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
