import { CheckCircle2 } from "lucide-react";

import {
  SUCCESS_COPY,
  normalizeBookingStatus,
} from "@/components/goair/confirmation/confirmation-utils";
import type { BookingRecord } from "@/lib/goair";
import { cn } from "@/lib/utils";

type ConfirmationSuccessHeaderProps = {
  booking: BookingRecord | undefined;
  className?: string;
};

export function ConfirmationSuccessHeader({ booking, className }: ConfirmationSuccessHeaderProps) {
  const status = normalizeBookingStatus(booking);
  const copy = SUCCESS_COPY[status];

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
      <p className="mt-4 text-sm font-bold text-accent">{copy.successLine}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-primary sm:text-3xl">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
    </div>
  );
}
