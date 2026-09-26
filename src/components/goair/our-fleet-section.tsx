import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, Bus, Car, Users } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Button } from "@/components/ui/button";
import type { VehicleType } from "@/lib/goair";
import { fetchVehicleTypes } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";

const vehicleTypesQueryKey = ["goair", "vehicle-types"] as const;

// Real fleet photos the user supplied, in the same order as the Beirut
// Transfer reference (Sedan → Mini Van → Full-size Van → Large Van).
// vehicle_types has no image column, so these are matched by POSITION to
// vehicleTypes sorted by capacity ascending (fetchVehicleTypes' own order),
// not by id. If GoAir ever has a 5th/6th tier, those extra cards fall back
// to the icon. Swap this array's order/URLs if the categories don't line up.
const FLEET_PHOTOS = [
  "https://imgcdn.bokun.tools/5f180f08-6e9a-49c2-8412-35f2c3fe629e.jpeg?fm=auto&mode=fit&crop=center&dpr=1&w=1678",
  "https://imgcdn.bokun.tools/b3afc5a0-1c84-4602-a276-17c5c091d823.jpeg?fm=auto&mode=fit&crop=center&dpr=1&w=1678",
  "https://imgcdn.bokun.tools/38421692-d6fa-40a2-adfd-5294002266fc.jpeg?fm=auto&mode=fit&crop=center&dpr=1&w=1678",
  "https://imgcdn.bokun.tools/a7a5cd36-69be-4436-a47c-32efa649830d.jpeg?fm=auto&mode=fit&crop=center&dpr=1&w=1678",
];

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <SectionHeader
        title={t("ourFleet.sectionTitle")}
        description={t("ourFleet.sectionDescription")}
        align="center"
        className="mx-auto"
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {vehicleTypes.map((vehicle, index) => (
          <FleetCard key={vehicle.id} vehicle={vehicle} photo={FLEET_PHOTOS[index]} />
        ))}
      </div>
    </section>
  );
}

function FleetCard({ vehicle, photo }: { vehicle: VehicleType; photo: string | undefined }) {
  const { t } = useTranslation();
  // Fallback for any tier beyond the 4 supplied photos: small vehicles get
  // a car icon, 5+ seats get a bus icon.
  const Icon = vehicle.capacity <= 4 ? Car : Bus;

  return (
    <div className="flex flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-card text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
      <div className="flex h-32 w-full items-center justify-center overflow-hidden bg-primary/5">
        {photo ? (
          <img
            src={photo}
            alt={vehicle.labelAr}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <Icon className="size-14 text-primary" aria-hidden />
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

