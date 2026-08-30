import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/goair";

type PriceCardProps = {
  amount: number | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PriceCard({ amount, label = "ابتداءً من", size = "md", className }: PriceCardProps) {
  if (amount == null) return null;

  const sizeClass =
    size === "lg"
      ? "text-2xl sm:text-3xl"
      : size === "sm"
        ? "text-lg"
        : "text-xl";

  return (
    <div className={cn("leading-none", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display font-extrabold text-accent", sizeClass)}>
        {formatUsd(amount)}
      </p>
    </div>
  );
}
