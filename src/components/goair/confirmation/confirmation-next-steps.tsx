import { normalizeBookingStatus } from "@/components/goair/confirmation/confirmation-utils";
import type { BookingRecord } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type ConfirmationNextStepsProps = {
  booking: BookingRecord | undefined;
  className?: string;
};

export function ConfirmationNextSteps({ booking, className }: ConfirmationNextStepsProps) {
  const { t } = useTranslation();
  const status = normalizeBookingStatus(booking);

  return (
    <section className={cn("rounded-xl border border-border/80 bg-secondary/30 p-5", className)}>
      <h2 className="font-display text-base font-extrabold text-primary">
        {t("confirmation.nextSteps.title")}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>{t("confirmation.nextSteps.keepTicket")}</li>
        {status === "pending" ? <li>{t("confirmation.nextSteps.pendingNote")}</li> : null}
        {status === "confirmed" ? <li>{t("confirmation.nextSteps.confirmedNote")}</li> : null}
        <li>{t("confirmation.nextSteps.driverWait")}</li>
      </ul>
    </section>
  );
}
