import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

type BookingPriceSummaryProps = {
  seats: number;
  pricePerSeat: number;
  total: number;
  className?: string;
  compact?: boolean;
  packageName?: string;
  packagePricePerSeat?: number;
  /** Private/charter booking — whole vehicle, flat price (not per seat). */
  isPrivate?: boolean;
};

export function BookingPriceSummary({
  seats,
  pricePerSeat,
  total,
  className,
  compact = false,
  packageName,
  packagePricePerSeat,
  isPrivate = false,
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
      {isPrivate ? (
        <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          حجز خاص — العربية كلها لمجموعتك
        </span>
      ) : null}

      <dl className={cn("mt-4 space-y-3", compact && "mt-3 space-y-2 text-sm")}>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{isPrivate ? "عدد الركاب" : "عدد المقاعد"}</dt>
          <dd className="font-bold text-primary">{seats}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">
            {isPrivate ? "السعر الكامل للعربية" : "سعر المقعد"}
          </dt>
          <dd className="font-bold text-primary">{formatUsd(pricePerSeat)}</dd>
        </div>
        {packageName && packagePricePerSeat ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-accent">+ {packageName}</dt>
            <dd className="font-bold text-accent">{formatUsd(packagePricePerSeat)}</dd>
          </div>
        ) : null}
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
