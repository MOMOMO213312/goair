import { useQuery } from "@tanstack/react-query";
import { Briefcase, Bus, Car, Caravan, Users } from "lucide-react";

import busImage from "@/assets/vehicle-bus.jpg";
import hiaceImage from "@/assets/vehicle-hiace.jpg";
import vanImage from "@/assets/vehicle-van.jpg";
import { SectionHeader } from "@/components/goair/section-header";
import { fetchVehicleTypeMinPrices, fetchVehicleTypes, formatUsd } from "@/lib/goair";
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

/**
 * Representative photo per group-size tier — illustrative only, not a promise
 * of the exact model (see note above: GoAir sells a transfer/seat, and the
 * vehicle that actually runs a departure is a dispatch detail that can
 * change). Matches the real fleet tiers in `lib/trip-media.ts::getVehicleImage`
 * (van ≤8, hiace ≤14, bus >14) — there is no sedan in the real fleet.
 * Copy below never names a vehicle model, only capacity.
 */
const IMAGE_BY_TIER: Record<string, string> = {
  small: vanImage,
  medium: hiaceImage,
  large: busImage,
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
 *
 * Each card leads with its real lowest live price ("من $X") the way
 * international transfer sites do, so the group-size choice already
 * carries a credible number before the customer opens the search.
 */
export function RideTypesSection() {
  const { data: vehicleTypes } = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const { data: minPrices } = useQuery({
    queryKey: ["goair", "vehicle-type-min-prices"],
    queryFn: fetchVehicleTypeMinPrices,
  });

  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  const cheapestId = minPrices
    ? Object.entries(minPrices).sort((a, b) => a[1] - b[1])[0]?.[0]
    : undefined;

  return (
    <section id="services" className="scroll-mt-20 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title="اختار حسب حجم مجموعتك"
          description="سعر حقيقي من أول نظرة — قبل ما تدخل تبحث عن رحلتك."
        />

        <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vehicleTypes.map((vehicle) => {
            const tier = tierFor(vehicle.capacity);
            const TierIcon = ICON_BY_TIER[tier] ?? Car;
            const tierImage = IMAGE_BY_TIER[tier];
            const dotCount = Math.min(vehicle.capacity, 6);
            const isLarge = tier === "large";
            const minPrice = minPrices?.[vehicle.id];
            const isCheapest = vehicle.id === cheapestId;

            return (
              <a
                key={vehicle.id}
                href="#find-your-ride"
                className={cn(
                  "group relative flex w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1 sm:w-auto sm:shrink",
                  isLarge
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-float)]"
                    : "border border-border bg-background text-primary shadow-sm",
                )}
              >
                {tierImage ? (
                  <img
                    src={tierImage}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : null}

                <div className="relative flex flex-1 flex-col p-6">
                  {isCheapest ? (
                    <span
                      className={cn(
                        "absolute -top-3 right-6 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold",
                        isLarge
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      الأوفر اقتصاديًا
                    </span>
                  ) : null}

                  <TierIcon
                    className={cn("size-8", isLarge ? "text-accent" : "text-primary")}
                    aria-hidden
                  />

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

                  {minPrice != null ? (
                    <p className="mt-4 flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          isLarge ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        من
                      </span>
                      <span className="font-display text-2xl font-extrabold">
                        {formatUsd(minPrice)}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          isLarge ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        للمقعد
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-1.5">
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <Users
                        key={i}
                        className={cn("size-3.5", isLarge ? "text-accent" : "text-accent")}
                        aria-hidden
                      />
                    ))}
                    {vehicle.capacity > dotCount ? (
                      <span className="text-xs font-bold text-accent">
                        +{vehicle.capacity - dotCount}
                      </span>
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
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
