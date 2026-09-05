import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { fetchVehicleTypes } from "@/lib/goair";

const BLURB_BY_TIER: Record<string, string> = {
  small: "الأنسب للعائلات والمجموعات الصغيرة.",
  medium: "مساحة أكبر لمجموعات السياحة والشركات المتوسطة.",
  large: "أفضل خيار اقتصادي للمجموعات الكبيرة ورحلات الشركات.",
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
          {vehicleTypes.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex flex-col rounded-2xl border border-border bg-background p-6 shadow-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Users className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-primary">
                لغاية {vehicle.capacity} راكب
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {BLURB_BY_TIER[tierFor(vehicle.capacity)]}
              </p>

              {vehicle.maxLuggage != null ? (
                <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Briefcase className="size-4 text-accent" aria-hidden />
                  حتى {vehicle.maxLuggage} حقيبة
                </span>
              ) : null}

              <a
                href="#find-your-ride"
                className="mt-5 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-secondary"
              >
                ابحث عن رحلتك
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
