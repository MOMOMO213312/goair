import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type BookingPriceSummaryProps = {
  seats: number;
  pricePerSeat: number;
  total: number;
  className?: string;
  compact?: boolean;
  packageName?: string;
  /** Private/charter booking — whole vehicle, flat price (not per seat). */
  isPrivate?: boolean;
  /** Flat total for selected `addon_services` — not multiplied by seats. */
  addonsTotal?: number;
};

export function BookingPriceSummary({
  seats,
  pricePerSeat,
  total,
  className,
  compact = false,
  packageName,
  isPrivate = false,
  addonsTotal = 0,
}: BookingPriceSummaryProps) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn(
        "border-accent/20 bg-card shadow-[var(--shadow-card)]",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="font-display text-sm font-bold text-primary">{t("booking.priceSummary.title")}</h2>
      {isPrivate ? (
        <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          {t("booking.priceSummary.privateBadge")}
        </span>
      ) : null}
      {packageName ? (
        <span className="mt-1 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
          {t("booking.priceSummary.packageBadge", { name: packageName })}
        </span>
      ) : null}

      <dl className={cn("mt-4 space-y-3", compact && "mt-3 space-y-2 text-sm")}>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{isPrivate ? t("booking.priceSummary.passengersCount") : t("booking.priceSummary.seatsCount")}</dt>
          <dd className="font-bold text-primary">{seats}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">
            {isPrivate
              ? t("booking.priceSummary.fullVehiclePrice")
              : packageName
                ? t("booking.priceSummary.seatPriceWithPackage")
                : t("booking.priceSummary.seatPrice")}
          </dt>
          <dd className="font-bold text-primary">{formatUsd(pricePerSeat)}</dd>
        </div>
        {addonsTotal > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("booking.priceSummary.extraServices")}</dt>
            <dd className="font-bold text-primary">{formatUsd(addonsTotal)}</dd>
          </div>
        ) : null}
      </dl>

      <div
        className={cn(
          "mt-4 flex items-center justify-between border-t border-border pt-4",
          compact && "mt-3 pt-3",
        )}
      >
        <span className="font-display font-bold text-primary">{t("booking.priceSummary.total")}</span>
        <span className="font-display text-2xl font-extrabold text-accent">{formatUsd(total)}</span>
      </div>
    </Card>
  );
}
