import { BadgeCheck, CalendarX2, CreditCard, ShieldCheck, UserRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const POINTS = [
  { icon: BadgeCheck, label: "سعر ثابت من أول لحظة — من غير مفاجآت عند الدفع" },
  { icon: CalendarX2, label: "إلغاء مجاني حتى 24 ساعة قبل الرحلة" },
  { icon: CreditCard, label: "بدون رسوم بطاقة إضافية — كل الرسوم شاملة" },
  { icon: UserRound, label: "استقبال بلافتة باسمك عند خروجك من المطار" },
  { icon: ShieldCheck, label: "سائقين محترفين ومركبات مفحوصة دوريًا" },
] as const;

/**
 * Trust/reassurance sidebar shown next to the booking flow — same role as
 * the "Why book with us" panel on major transfer-booking sites, but with
 * GoAir's own real, documented guarantees (no borrowed copy).
 */
export function BookingTrustPanel({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-sm font-extrabold text-primary">ليه تحجز مع GoAir</h2>
      <ul className="mt-4 space-y-3.5">
        {POINTS.map((point) => (
          <li key={point.label} className="flex items-start gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <point.icon className="size-4" aria-hidden />
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">{point.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
