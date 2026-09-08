import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

type BookingTrustNoteProps = {
  className?: string;
};

export function BookingTrustNote({ className }: BookingTrustNoteProps) {
  const { t } = useTranslation();
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border/80 bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
      <span>{t("booking.trustNote")}</span>
    </p>
  );
}
