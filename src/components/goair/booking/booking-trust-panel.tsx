import { BadgeCheck, CreditCard, type LucideIcon, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

const POINTS: { key: "fixedPrice" | "noCardFees" | "vettedDrivers"; icon: LucideIcon }[] = [
  { key: "fixedPrice", icon: BadgeCheck },
  { key: "noCardFees", icon: CreditCard },
  { key: "vettedDrivers", icon: ShieldCheck },
];

/**
 * Trust/reassurance panel shown next to the booking flow. Deliberately only
 * carries guarantees that AREN'T already repeated on every trip/vehicle card
 * (free cancellation, named pickup) — a sidebar that just echoes what's
 * already on screen reads as filler, not reassurance. Three, said with more
 * visual weight, beats five that duplicate.
 */
export function BookingTrustPanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-sm font-extrabold text-primary">{t("booking.trustPanel.title")}</h2>
      <ul className="mt-4 space-y-4">
        {POINTS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium leading-relaxed text-foreground/90">
              {t(`booking.trustPanel.${key}` as const)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
