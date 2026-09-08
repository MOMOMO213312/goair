import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

type BookingHeaderProps = {
  className?: string;
};

export function BookingHeader({ className }: BookingHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{t("booking.header.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("booking.header.subtitle")}</p>
    </header>
  );
}
