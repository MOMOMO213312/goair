import { useQuery } from "@tanstack/react-query";
import { Briefcase, Bus, Car, Caravan, Users } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { fetchVehicleTypes } from "@/lib/goair";
import { cn } from "@/lib/utils";

const BLURB_BY_TIER: Record<string, string> = {
  small: "الأنسب للعائلات والمجموعات الصغيرة.",
  medium: "مساحة أكبر لمجموعات السياحة والشركات المتوسطة.",
  large: "أفضل خيار اقتصادي للمجموعات الكبيرة ورحلات الشركات.",
};

const ICON_BY_TIER: Record<string, typeof Car> = {
  small: Car,
  medium: Caravan,
  large: Bus,
};

function tierFor(capacity: number): keyof typeof BLURB_BY_TIER {
  if (capacity <= 8) return "small";
  if (capacity <= 14) return "medium";
  return "large";
}

/**
 * Group-size tiers, read live from `vehicle_types` capacity values — but
 * deliberately shown to the customer as trip/group-size tiers, never as
 * vehicle names or fleet photos. GoAir sells a transfer, not a specific
 * vehicle; which vehicle actually runs a given departure is an internal
 * dispatch detail that can change without changing what the customer booked.
 */
export function RideTypesSection() {
  const { data: vehicleTypes } = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });

  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  return (
    <section id="services" className="scroll-mt-20 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader title="اختار حسب حجم مجموعتك" description="السعر بيظهر بعد اختيار خط رحلتك — نفس مستوى الراحة والاستقبال لأي حجم." />

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {vehicleTypes.map((vehicle) => {
            const tier = tierFor(vehicle.capacity);
            const TierIcon = ICON_BY_TIER[tier] ?? Car;
            const dotCount = Math.min(vehicle.capacity, 6);
            const isLarge = tier === "large";

            return (
              <a
                key={vehicle.id}
                href="#find-your-ride"
                className={cn(
                  "group flex flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1",
                  isLarge
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-float)]"
                    : "border border-border bg-background text-primary shadow-sm",
                )}
              >
                <TierIcon className={cn("size-8", isLarge ? "text-accent" : "text-primary")} aria-hidden />

                <h3 className="mt-5 font-display text-lg font-extrabold">
                  لغاية {vehicle.capacity} راكب
                </h3>
                <p
                  className={cn(
                    "mt-1.5 text-sm leading-relaxed",
                    isLarge ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {BLURB_BY_TIER[tier]}
                </p>

                <div className="mt-4 flex items-center gap-1.5">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <Users
                      key={i}
                      className={cn("size-3.5", isLarge ? "text-accent" : "text-accent")}
                      aria-hidden
                    />
                  ))}
                  {vehicle.capacity > dotCount ? (
                    <span className="text-xs font-bold text-accent">+{vehicle.capacity - dotCount}</span>
                  ) : null}
                </div>

                {vehicle.maxLuggage != null ? (
                  <span
                    className={cn(
                      "mt-3 flex items-center gap-1.5 text-xs font-bold",
                      isLarge ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <Briefcase className="size-4 text-accent" aria-hidden />
                    حتى {vehicle.maxLuggage} حقيبة
                  </span>
                ) : null}

                <span
                  className={cn(
                    "mt-5 inline-flex w-fit items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                    isLarge
                      ? "bg-accent text-accent-foreground group-hover:bg-accent/90"
                      : "border border-border text-primary group-hover:bg-secondary",
                  )}
                >
                  ابحث عن رحلتك
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
