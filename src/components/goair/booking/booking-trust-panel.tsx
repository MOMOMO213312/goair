import { BadgeCheck, CalendarX2, CreditCard, type LucideIcon, ShieldCheck, UserRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

const POINT_ICONS: LucideIcon[] = [BadgeCheck, CalendarX2, CreditCard, UserRound, ShieldCheck];
const POINT_KEYS = ["point1", "point2", "point3", "point4", "point5"] as const;

/**
 * Trust/reassurance sidebar shown next to the booking flow — same role as
 * the "Why book with us" panel on major transfer-booking sites, but with
 * GoAir's own real, documented guarantees (no borrowed copy).
 */
export function BookingTrustPanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-sm font-extrabold text-primary">{t("booking.trustPanel.title")}</h2>
      <ul className="mt-4 space-y-3.5">
        {POINT_KEYS.map((key, index) => {
          const Icon = POINT_ICONS[index] ?? ShieldCheck;
          const label = t(`booking.trustPanel.${key}` as const);
          return (
            <li key={key} className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{label}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
