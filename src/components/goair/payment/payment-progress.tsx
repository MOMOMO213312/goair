import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "الرحلة" },
  { id: 2, label: "بيانات المسافر" },
  { id: 3, label: "الدفع" },
] as const;

type PaymentProgressProps = {
  className?: string;
};

export function PaymentProgress({ className }: PaymentProgressProps) {
  return (
    <nav
      aria-label="خطوات الحجز"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3 sm:text-sm",
        className,
      )}
    >
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="text-muted-foreground/50" aria-hidden>
              ←
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition-colors",
              step.id === 3
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px]",
                step.id === 3 ? "bg-accent text-accent-foreground" : "bg-background text-primary",
              )}
            >
              {step.id}
            </span>
            {step.label}
          </span>
        </div>
      ))}
    </nav>
  );
}
