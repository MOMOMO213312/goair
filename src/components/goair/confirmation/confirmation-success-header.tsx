import { CheckCircle2 } from "lucide-react";

import { normalizeBookingStatus } from "@/components/goair/confirmation/confirmation-utils";
import type { BookingRecord } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type ConfirmationSuccessHeaderProps = {
  booking: BookingRecord | undefined;
  className?: string;
};

export function ConfirmationSuccessHeader({ booking, className }: ConfirmationSuccessHeaderProps) {
  const { t } = useTranslation();
  const status = normalizeBookingStatus(booking);

  return (
    <div className={cn("text-center", className)}>
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15">
        <CheckCircle2
          className={cn(
            "size-9",
            status === "cancelled" ? "text-muted-foreground" : "text-accent",
          )}
          aria-hidden
        />
      </div>
      <p className="mt-4 text-sm font-bold text-accent">
        {t(`confirmation.successCopy.${status}.successLine`)}
      </p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-primary sm:text-3xl">
        {t(`confirmation.successCopy.${status}.title`)}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(`confirmation.successCopy.${status}.subtitle`)}
      </p>
    </div>
  );
}
