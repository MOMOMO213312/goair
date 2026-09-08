import { Check } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export const BOOKING_STEP_IDS = [1, 2, 3, 4, 5] as const;

export type BookingStepId = (typeof BOOKING_STEP_IDS)[number];

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
  const { t } = useTranslation();
  const BOOKING_STEPS = [
    { id: 1 as const, label: t("booking.stepper.vehicle") },
    { id: 2 as const, label: t("booking.stepper.extras") },
    { id: 3 as const, label: t("booking.stepper.passengers") },
    { id: 4 as const, label: t("booking.stepper.review") },
    { id: 5 as const, label: t("booking.stepper.payment") },
  ];
  return (
    <nav
      aria-label={t("booking.stepper.ariaLabel")}
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
