import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useStockPhoto } from "@/hooks/use-stock-photo";
import type { PackageTier } from "@/lib/goair";
import { fetchActivePackages, formatUsd } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

function JourneyCard({ pkg }: { pkg: PackageTier }) {
  const { t, language } = useTranslation();
  const name = localize(pkg.name, pkg.nameEn, language);
  const tagline = pkg.tagline ? localize(pkg.tagline, pkg.taglineEn, language) : null;
  const photo = useStockPhoto("packages", pkg.id, pkg.imageUrl);

  return (
    <Link
      to="/package"
      search={{ packageId: pkg.id }}
      className={cn(
        "group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]",
        pkg.isHighlighted ? "ring-2 ring-accent" : "",
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-primary" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

      {pkg.isHighlighted ? (
        <span className="absolute start-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
          <Sparkles className="size-3" aria-hidden />
          {t("chooseYourJourney.mostRequested")}
        </span>
      ) : null}

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-lg font-extrabold text-white sm:text-xl">{name}</h3>
        {tagline ? <p className="mt-1 text-sm leading-relaxed text-white/80">{tagline}</p> : null}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-2xl font-extrabold text-white">{formatUsd(pkg.priceUsd)}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
            {t("chooseYourJourney.explore")}
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * "اختار رحلتك" — the packages catalog reframed as travel experiences
 * (large image-led cards) instead of a SaaS-style pricing grid, per the
 * product vision. Same real `packages` data as the /explore packages tab —
 * this is a homepage teaser into that same booking flow, not a new backend.
 */
export function ChooseYourJourneySection() {
  const { t } = useTranslation();
  const { data: packages } = useQuery({
    queryKey: ["goair", "packages"],
    queryFn: fetchActivePackages,
  });

  if (!packages || packages.length === 0) return null;

  return (
    <section className="goair-section bg-mist/60">
      <div className="goair-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            title={t("chooseYourJourney.sectionTitle")}
            description={t("chooseYourJourney.sectionDescription")}
          />
          <Link
            to="/explore"
            search={{ tab: "packages" }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            {t("chooseYourJourney.seeAll")}
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.slice(0, 4).map((pkg) => (
            <JourneyCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}
