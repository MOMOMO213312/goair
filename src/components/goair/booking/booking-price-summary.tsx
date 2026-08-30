import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

type BookingPriceSummaryProps = {
  seats: number;
  pricePerSeat: number;
  total: number;
  className?: string;
  compact?: boolean;
};

export function BookingPriceSummary({
  seats,
  pricePerSeat,
  total,
  className,
  compact = false,
}: BookingPriceSummaryProps) {
  return (
    <Card
      className={cn(
        "border-accent/20 bg-card shadow-[var(--shadow-card)]",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="font-display text-sm font-bold text-primary">ملخص السعر</h2>

      <dl className={cn("mt-4 space-y-3", compact && "mt-3 space-y-2 text-sm")}>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">عدد المقاعد</dt>
          <dd className="font-bold text-primary">{seats}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">سعر المقعد</dt>
          <dd className="font-bold text-primary">{formatUsd(pricePerSeat)}</dd>
        </div>
      </dl>

      <div
        className={cn(
          "mt-4 flex items-center justify-between border-t border-border pt-4",
          compact && "mt-3 pt-3",
        )}
      >
        <span className="font-display font-bold text-primary">الإجمالي</span>
        <span className="font-display text-2xl font-extrabold text-accent">{formatUsd(total)}</span>
      </div>
    </Card>
  );
}
