import { Loader2, Luggage, Pencil, Phone, Plane, User } from "lucide-react";

import { BookingCancellationNote } from "@/components/goair/booking/booking-cancellation-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type BookingConfirmStepProps = {
  fullName: string;
  phone: string;
  flight: string;
  luggage: number;
  notes: string;
  packageName?: string;
  addonNames?: string[];
  onEditExtras: () => void;
  onEditPassengers: () => void;
  onConfirm: () => void;
  busy: boolean;
  className?: string;
};

/** Step 4 — final review before the booking is actually created and payment starts. */
export function BookingConfirmStep({
  fullName,
  phone,
  flight,
  luggage,
  notes,
  packageName,
  addonNames,
  onEditExtras,
  onEditPassengers,
  onConfirm,
  busy,
  className,
}: BookingConfirmStepProps) {
  const { t, language } = useTranslation();
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{t("booking.confirmStep.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("booking.confirmStep.subtitle")}
      </p>

      {/* Extras */}
      <div className="mt-6 rounded-xl border border-border/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-sm font-bold text-primary">{t("booking.confirmStep.extrasTitle")}</p>
          <button
            type="button"
            onClick={onEditExtras}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <Pencil className="size-3.5" aria-hidden />
            {t("booking.confirmStep.edit")}
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">{t("booking.confirmStep.package")}</dt>
            <dd className="font-bold text-primary">{packageName ?? t("booking.confirmStep.noAddons")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Luggage className="size-4 text-accent" aria-hidden />
              {t("booking.confirmStep.luggage")}
            </dt>
            <dd className="font-bold text-primary">{luggage}</dd>
          </div>
          {addonNames && addonNames.length > 0 ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">{t("booking.confirmStep.extraServices")}</dt>
              <dd className="max-w-[70%] text-end font-bold text-primary">{addonNames.join(language === "ar" ? "، " : ", ")}</dd>
            </div>
          ) : null}
          {notes ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">{t("booking.confirmStep.notes")}</dt>
              <dd className="max-w-[70%] text-end text-primary">{notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Passenger */}
      <div className="mt-4 rounded-xl border border-border/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-sm font-bold text-primary">{t("booking.confirmStep.passengerTitle")}</p>
          <button
            type="button"
            onClick={onEditPassengers}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <Pencil className="size-3.5" aria-hidden />
            {t("booking.confirmStep.edit")}
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <User className="size-4 text-accent" aria-hidden />
              {t("booking.confirmStep.name")}
            </dt>
            <dd className="font-bold text-primary">{fullName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-4 text-accent" aria-hidden />
              {t("booking.confirmStep.mobile")}
            </dt>
            <dd className="font-bold text-primary" dir="ltr">
              {phone}
            </dd>
          </div>
          {flight ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Plane className="size-4 text-accent" aria-hidden />
                {t("booking.confirmStep.flightNumber")}
              </dt>
              <dd className="font-bold text-primary" dir="ltr">
                {flight}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="mt-6">
        <BookingCancellationNote />
      </div>

      <Button
        type="button"
        size="lg"
        disabled={busy}
        onClick={onConfirm}
        className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
      >
        {busy ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t("booking.confirmStep.confirming")}
          </>
        ) : (
          t("booking.confirmStep.confirmButton")
        )}
      </Button>
    </Card>
  );
}
