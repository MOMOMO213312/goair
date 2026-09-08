import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type PaymentHeaderProps = {
  className?: string;
};

export function PaymentHeader({ className }: PaymentHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{t("payment.header.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("payment.header.subtitle")}
      </p>
    </header>
  );
}
