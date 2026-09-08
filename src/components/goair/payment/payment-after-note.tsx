import { Info } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type PaymentAfterNoteProps = {
  className?: string;
};

export function PaymentAfterNote({ className }: PaymentAfterNoteProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-3 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <p>
        {t("payment.afterNote")}
      </p>
    </div>
  );
}
