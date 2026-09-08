import { Clock, Headset, PlaneTakeoff, Smartphone } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

const ITEMS = [
  { icon: PlaneTakeoff, key: "flightTracking" as const },
  { icon: Clock, key: "freeWaiting" as const },
  { icon: Headset, key: "support" as const },
  { icon: Smartphone, key: "quickBooking" as const },
];

/** Dark operational-highlights strip below the ride-types section. */
export function ServiceHighlights() {
  const { t } = useTranslation();
  return (
    <section className="bg-primary py-8">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-primary-foreground">
                {t(`serviceHighlights.${item.key}.title`)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-primary-foreground/70">
                {t(`serviceHighlights.${item.key}.text`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
