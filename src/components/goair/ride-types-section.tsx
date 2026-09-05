import { useQuery } from "@tanstack/react-query";
import { Briefcase, Minus, Plus, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { formatUsd, fetchVehicleTypeStartingPrices, fetchVehicleTypes } from "@/lib/goair";
import { cn } from "@/lib/utils";

type TierCopy = { comfort: string; useCase: string };

const COPY_BY_TIER: Record<string, TierCopy> = {
  small: { comfort: "خصوصية عالية", useCase: "الأنسب للعائلات والمجموعات الصغيرة" },
  medium: { comfort: "راحة واسعة", useCase: "توازن كويس بين المساحة والسعر" },
  large: { comfort: "مساحة لمجموعة كبيرة", useCase: "مناسبة لمجموعات السياحة والشركات المتوسطة" },
  xlarge: { comfort: "أفضل سعر للفرد", useCase: "الخيار الاقتصادي للمجموعات الكبيرة ورحلات الشركات" },
};

function tierFor(capacity: number): keyof typeof COPY_BY_TIER {
  if (capacity <= 4) return "small";
  if (capacity <= 8) return "medium";
  if (capacity <= 14) return "large";
  return "xlarge";
}

/**
 * Group-size tiers, read live from `vehicle_types` — shown to the customer
 * as trip/group-size options, never as vehicle names or fleet photos.
 * "Starting from" prices are the real minimum shared price across all
 * routes for that capacity (see fetchVehicleTypeStartingPrices) — the exact
 * price for the customer's actual route only appears after a real search.
 */
export function RideTypesSection() {
  const [passengerCount, setPassengerCount] = useState<number | null>(null);

  const { data: vehicleTypes } = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const { data: startingPrices } = useQuery({
    queryKey: ["goair", "vehicle-type-starting-prices"],
    queryFn: fetchVehicleTypeStartingPrices,
  });

  const sortedTypes = useMemo(
    () => (vehicleTypes ?? []).slice().sort((a, b) => a.capacity - b.capacity),
    [vehicleTypes],
  );

  const recommendedId = useMemo(() => {
    if (!passengerCount || sortedTypes.length === 0) return null;
    const fit = sortedTypes.find((v) => v.capacity >= passengerCount);
    return fit?.id ?? sortedTypes[sortedTypes.length - 1]?.id ?? null;
  }, [passengerCount, sortedTypes]);

  if (sortedTypes.length === 0) return null;

  return (
    <section className="bg-mist/30 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            اختار الرحلة المناسبة لمجموعتك
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            GoAir بتقترحلك أنسب خيار حسب عدد أفراد مجموعتك — مع نفس مستوى الراحة والاستقبال بالاسم لأي حجم.
          </p>
        </div>

        {/* Passenger selector — highlights the matching card below, doesn't change the search form itself */}
        <div className="mx-auto mt-7 flex w-fit items-center gap-4 rounded-full border border-border bg-background px-5 py-2.5 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">إحنا كام؟</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="تقليل عدد الركاب"
              onClick={() => setPassengerCount((c) => Math.max(1, (c ?? 1) - 1))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-6 text-center font-display text-lg font-extrabold text-primary">
              {passengerCount ?? "—"}
            </span>
            <button
              type="button"
              aria-label="زيادة عدد الركاب"
              onClick={() => setPassengerCount((c) => Math.min(50, (c ?? 0) + 1))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sortedTypes.map((vehicle) => {
            const copy = COPY_BY_TIER[tierFor(vehicle.capacity)];
            const startingPrice = startingPrices?.[vehicle.id];
            const isRecommended = recommendedId === vehicle.id;

            return (
              <div
                key={vehicle.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-background p-6 shadow-sm transition-shadow",
                  isRecommended
                    ? "border-accent shadow-lg ring-2 ring-accent/40"
                    : "border-border hover:shadow-md",
                )}
              >
                {isRecommended ? (
                  <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow">
                    <Sparkles className="size-3.5" aria-hidden />
                    الأفضل لك
                  </span>
                ) : null}

                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl",
                    isRecommended ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent",
                  )}
                >
                  <Users className="size-6" aria-hidden />
                </span>

                <h3 className="mt-4 font-display text-xl font-extrabold text-primary">
                  لغاية {vehicle.capacity} راكب
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.useCase}</p>

                <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
                    <span>{copy.comfort}</span>
                  </div>
                  {vehicle.maxLuggage != null ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="size-4 shrink-0 text-accent" aria-hidden />
                      <span>حتى {vehicle.maxLuggage} حقيبة</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-border/70 pt-4">
                  {startingPrice != null ? (
                    <p className="text-sm">
                      <span className="text-muted-foreground">يبدأ من </span>
                      <span className="font-display text-lg font-extrabold text-primary">
                        {formatUsd(startingPrice)}
                      </span>
                      <span className="text-muted-foreground"> / للراكب</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">السعر بيظهر حسب خط رحلتك</p>
                  )}
                </div>

                <a
                  href="#find-your-ride"
                  className={cn(
                    "mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition-colors",
                    isRecommended
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "border border-border text-primary hover:bg-secondary",
                  )}
                >
                  ابدأ البحث
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
