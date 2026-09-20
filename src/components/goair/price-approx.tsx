import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

/**
 * Secondary line under an exact USD amount due: "≈ 37.5 SAR". Renders nothing when USD is
 * selected. `showNote` adds the "other currencies are for reference only" reminder.
 */
export function PriceApprox({
  usd,
  showNote = false,
  className,
}: {
  usd: number;
  showNote?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { formatApprox } = useCurrency();
  const approx = formatApprox(usd);
  if (!approx) return null;

  return (
    <p className={cn("text-xs font-semibold text-muted-foreground", className)}>
      {approx}
      {showNote ? (
        <span className="block font-normal">{t("currencySwitcher.referenceNote")}</span>
      ) : null}
    </p>
  );
}
