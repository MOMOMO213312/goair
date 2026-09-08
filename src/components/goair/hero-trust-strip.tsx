import { BadgeCheck, CalendarX2, UserRound } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

const ITEMS = [
  { icon: BadgeCheck, key: "fixedPrice" as const },
  { icon: CalendarX2, key: "freeCancellation" as const },
  { icon: UserRound, key: "namedPickup" as const },
];

/** Directly under the hero — the first trust signal a visitor sees. */
export function HeroTrustStrip() {
  const { t } = useTranslation();
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-3 py-4 sm:justify-center sm:px-6 sm:py-5">
            <item.icon className="size-5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-primary">
                {t(`heroTrustStrip.${item.key}.title`)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {t(`heroTrustStrip.${item.key}.text`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
