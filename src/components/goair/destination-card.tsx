import { Link } from "@tanstack/react-router";

import { PriceCard } from "@/components/goair/price-card";
import { DestinationPlaceholder } from "@/components/goair/destination-placeholder";
import { Card } from "@/components/ui/card";
import { getCountryLabel } from "@/lib/i18n/country-labels";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { useDestinationPhoto } from "@/hooks/use-destination-photo";
import type { DestinationSummary } from "@/lib/trip-stats";
import { getDedicatedDestinationImage, getDestinationCardImage } from "@/lib/trip-media";
import { cn } from "@/lib/utils";

type DestinationCardProps = {
  destination: DestinationSummary;
  className?: string;
};

export function DestinationCard({ destination, className }: DestinationCardProps) {
  const { t, language } = useTranslation();
  const displayName = localize(destination.name, destination.nameEn, language);
  const dedicatedImage = getDedicatedDestinationImage(destination.name);
  const poolFallback = getDestinationCardImage(destination.name, destination.country);
  const image = useDestinationPhoto(
    destination.country,
    destination.name,
    dedicatedImage,
    poolFallback,
  );
  const searchDate = new Date().toISOString().slice(0, 10);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/80 p-0 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      {image ? (
        <img
          src={image}
          alt={displayName}
          width={640}
          height={400}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <DestinationPlaceholder destination={destination.name} />
      )}

      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{getCountryLabel(destination.country, language)}</p>
        <h3 className="mt-1 font-display text-base font-bold text-primary">{displayName}</h3>
        <div className="mt-3 flex items-end justify-between gap-2">
          <PriceCard amount={destination.minPriceUsd} size="sm" />
          <Link
            to="/search"
            search={{
              country: destination.country,
              airport: destination.airportCode,
              destination: destination.name,
              date: searchDate,
              seats: 1,
            }}
            className="text-xs font-bold text-accent hover:underline"
          >
            {t("destinationCard.viewCta")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
