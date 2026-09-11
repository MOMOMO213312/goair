import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowLeft,
  Armchair,
  PackageOpen,
  PlaneTakeoff,
  UserRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useStockPhoto } from "@/hooks/use-stock-photo";
import type { AddonService } from "@/lib/goair";
import { fetchAddonServices, formatUsd } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";

// Curated subset of the real addon_services catalog — the same six-service
// promise from the product vision (Transfer / Meet & Assist / Fast Track /
// Lounge / Baggage / Accessibility), matched by English name rather than
// showing all 20 catalog rows as equal-weight cards.
const FEATURED_NAMES = [
  "Meet & Assist",
  "Fast Track",
  "VIP Lounge Access",
  "Porter Service",
  "Assistance for Elderly & Accessibility Needs",
];

const ICONS: Record<string, LucideIcon> = {
  "Meet & Assist": UserRound,
  "Fast Track": Zap,
  "VIP Lounge Access": Armchair,
  "Porter Service": PackageOpen,
  "Assistance for Elderly & Accessibility Needs": Accessibility,
};

// Real curbside-pickup photo, same asset already used in the hero carousel —
// proven to load, and on-brand for the one hard-coded tile in this section.
const AIRPORT_TRANSFER_IMAGE =
  "https://images.unsplash.com/photo-1605407079290-c31423ab611a?q=80&w=1200&auto=format&fit=crop";

function ServiceTile({ service }: { service: AddonService }) {
  const { language } = useTranslation();
  const name = localize(service.name, service.nameEn, language);
  const photo = useStockPhoto("addon_services", service.id, service.imageUrl);
  const Icon = (service.nameEn && ICONS[service.nameEn]) || Zap;

  return (
    <div className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl border border-border/80 bg-primary shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
      <div className="relative flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15 text-accent">
            <Icon className="size-4" aria-hidden />
          </span>
          <p className="mt-2 truncate font-display text-sm font-bold text-primary-foreground">{name}</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-primary-foreground/80">
          {formatUsd(service.priceUsd)}+
        </span>
      </div>
    </div>
  );
}

export function GoairServicesSection() {
  const { t } = useTranslation();
  const { data: allServices } = useQuery({
    queryKey: ["goair", "addon-services"],
    queryFn: fetchAddonServices,
  });

  const featured = FEATURED_NAMES.map((name) => allServices?.find((s) => s.nameEn === name)).filter(
    (s): s is AddonService => Boolean(s),
  );

  return (
    <section className="goair-section">
      <div className="goair-container">
        <SectionHeader
          title={t("goairServices.sectionTitle")}
          description={t("goairServices.sectionDescription")}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Large hero tile — the core product, not an add-on */}
          <Link
            to="/"
            hash="find-your-ride"
            className="group relative flex min-h-[16rem] flex-col justify-end overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] lg:col-span-1 lg:row-span-2"
          >
            <img
              src={AIRPORT_TRANSFER_IMAGE}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
            <div className="relative p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <PlaneTakeoff className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-xl font-extrabold text-primary-foreground">
                {t("goairServices.transferTitle")}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-primary-foreground/80">
                {t("goairServices.transferDescription")}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                {t("goairServices.transferCta")}
                <ArrowLeft className="size-4" aria-hidden />
              </span>
            </div>
          </Link>

          {/* Smaller service tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {featured.map((service) => (
              <ServiceTile key={service.id} service={service} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
