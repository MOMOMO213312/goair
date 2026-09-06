import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const BOOKING_STEPS = [
  { id: 1, label: "المركبة" },
  { id: 2, label: "الإضافات" },
  { id: 3, label: "المسافرين" },
  { id: 4, label: "المراجعة" },
  { id: 5, label: "الدفع" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

type BookingStepperProps = {
  current: BookingStepId;
  className?: string;
};

/**
 * Persistent 5-step indicator shown across the whole booking journey:
 * Vehicle → Extras → Passengers+Transfers → Confirmation → Payment.
 * Steps behind the current one render as completed (check mark); steps
 * ahead render muted. Mirrors the step rail pattern used by major
 * transfer-booking sites, restyled with GoAir's own tokens.
 */
export function BookingStepper({ current, className }: BookingStepperProps) {
  return (
    <nav
      aria-label="خطوات الحجز"
      className={cn(
        "overflow-x-auto rounded-xl border border-border/80 bg-card px-4 py-4 shadow-[var(--shadow-card)] sm:px-6",
        className,
      )}
    >
      <ol className="flex min-w-max items-center justify-center gap-1.5 sm:gap-3">
        {BOOKING_STEPS.map((step, index) => {
          const isDone = step.id < current;
          const isCurrent = step.id === current;
          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-3">
              {index > 0 ? (
                <span
                  className={cn(
                    "h-px w-4 shrink-0 sm:w-10",
                    isDone || isCurrent ? "bg-accent/60" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors sm:size-9 sm:text-sm",
                    isCurrent
                      ? "bg-accent text-accent-foreground shadow-sm ring-4 ring-accent/15"
                      : isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-4" aria-hidden /> : step.id}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-[10px] font-bold sm:text-xs",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
