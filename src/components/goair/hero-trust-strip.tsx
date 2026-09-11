import { Armchair, Clock, Headphones, ShieldCheck, Tag } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

const ITEMS = [
  { icon: Armchair, key: "guaranteedSeat" as const },
  { icon: Clock, key: "onTime" as const },
  { icon: ShieldCheck, key: "safeComfortable" as const },
  { icon: Tag, key: "affordablePrices" as const },
  { icon: Headphones, key: "support247" as const },
];

/** Directly under the hero — the first trust signal a visitor sees. */
export function HeroTrustStrip() {
  const { t } = useTranslation();
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-6 divide-y divide-border px-4 py-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 sm:divide-y-0 sm:py-8 lg:grid-cols-5 lg:divide-x lg:divide-y-0 lg:divide-x-reverse lg:gap-x-0 lg:py-6">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-3 pt-6 first:pt-0 sm:pt-0 lg:px-5 lg:first:ps-0 lg:last:pe-0"
          >
            <item.icon className="mt-0.5 size-7 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
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
