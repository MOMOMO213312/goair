import { CalendarX2 } from "lucide-react";

import { cn } from "@/lib/utils";

type BookingCancellationNoteProps = {
  className?: string;
};

/** Shown on the booking page itself — not buried in /terms. Per Final Vision. */
export function BookingCancellationNote({ className }: BookingCancellationNoteProps) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <CalendarX2 className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
      <span>تقدر تلغي أو تعدّل حجزك مجانًا لحد 24 ساعة قبل موعد الرحلة.</span>
    </p>
  );
}
