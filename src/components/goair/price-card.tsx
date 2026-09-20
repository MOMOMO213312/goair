import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/language-context";

type PriceCardProps = {
  amount: number | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PriceCard({ amount, label, size = "md", className }: PriceCardProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  if (amount == null) return null;
  const displayLabel = label ?? t("priceCard.startingFrom");

  const sizeClass =
    size === "lg"
      ? "text-2xl sm:text-3xl"
      : size === "sm"
        ? "text-lg"
        : "text-xl";

  return (
    <div className={cn("leading-none", className)}>
      <p className="text-xs font-medium text-muted-foreground">{displayLabel}</p>
      <p className={cn("mt-1 font-display font-extrabold text-accent", sizeClass)}>
        {formatPrice(amount)}
      </p>
    </div>
  );
}
