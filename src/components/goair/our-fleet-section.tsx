import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, Bus, Car, Users } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Button } from "@/components/ui/button";
import type { VehicleType } from "@/lib/goair";
import { fetchVehicleTypes } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";

const vehicleTypesQueryKey = ["goair", "vehicle-types"] as const;

/**
 * "Our Fleet" — vehicle-tier cards under the hero, same idea as the
 * Beirut Transfer reference (car photo → capacity → luggage → CTA),
 * but without a fixed global price per tier: GoAir prices are per
 * route/trip (trip_options), not per vehicle type, so a single "$X"
 * here would be fabricated. The CTA instead scrolls back up to the real
 * search widget where the actual price for the chosen route appears.
 */
export function OurFleetSection() {
  const { t } = useTranslation();
  const { data: vehicleTypes } = useQuery({
    queryKey: vehicleTypesQueryKey,
    queryFn: fetchVehicleTypes,
  });

  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  // Defensive: always show smallest → largest regardless of what order the
  // query actually returned (it didn't match ascending capacity live).
  const sortedVehicleTypes = [...vehicleTypes].sort((a, b) => a.capacity - b.capacity);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <SectionHeader
        title={t("ourFleet.sectionTitle")}
        description={t("ourFleet.sectionDescription")}
        align="center"
        className="mx-auto"
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sortedVehicleTypes.map((vehicle) => (
          <FleetCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </section>
  );
}

function FleetCard({ vehicle }: { vehicle: VehicleType }) {
  const { t } = useTranslation();
  // Fallback icon for any tier with no image_url set yet (e.g. "bus"):
  // small vehicles get a car icon, 5+ seats get a bus icon.
  const Icon = vehicle.capacity <= 4 ? Car : Bus;
  const photo = vehicle.imageUrl;

  return (
    <div className="flex flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-card text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
      <div
        className={
          photo
            ? "flex h-32 w-full items-center justify-center overflow-hidden"
            : "flex h-32 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300"
        }
      >
        {photo ? (
          <img
            src={photo}
            alt={vehicle.labelAr}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-white/70 shadow-inner">
            <Icon className="size-8 text-primary" aria-hidden />
          </span>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-3 p-5">
        <h3 className="font-display text-base font-extrabold text-primary">{vehicle.labelAr}</h3>

        <div className="flex flex-col items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground/70" aria-hidden />
            {t("ourFleet.passengers", { count: vehicle.capacity })}
          </span>
          {vehicle.maxLuggage != null ? (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-muted-foreground/70" aria-hidden />
              {t("ourFleet.luggage", { count: vehicle.maxLuggage })}
            </span>
          ) : null}
        </div>

        <Button
          asChild
          className="mt-1 h-10 w-full bg-accent text-sm font-bold text-accent-foreground hover:bg-accent/90"
        >
          <Link to="/" hash="find-your-ride">
            {t("ourFleet.cta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
