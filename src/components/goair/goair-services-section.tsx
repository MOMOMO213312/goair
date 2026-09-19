import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, PlaneTakeoff, Sparkles } from "lucide-react";

import { ADDON_ICONS } from "@/components/goair/booking/booking-addons-step";
import { SectionHeader } from "@/components/goair/section-header";
import type { AddonService, AddonServiceCategory } from "@/lib/goair";
import { fetchAddonServices, formatUsd } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

// ⚠️ غيّر الصورة دي بصورة تخص GoAir (عربية/مطار القاهرة أو بيروت).
// لو هترفع ملف محلي: حطه في src/assets واستورده هنا بدل الرابط، مثلًا:
//   import airportTransferImage from "@/assets/airport-transfer.jpg";
// وبعدين خلي AIRPORT_TRANSFER_IMAGE = airportTransferImage.
const AIRPORT_TRANSFER_IMAGE =
  "https://images.unsplash.com/photo-1605407079290-c31423ab611a?q=80&w=1200&auto=format&fit=crop";

const CATEGORY_ORDER: AddonServiceCategory[] = ["airport", "before_trip", "luggage", "destination"];
const INITIAL_VISIBLE = 6;

type Filter = "all" | AddonServiceCategory;

function ServiceCard({ service }: { service: AddonService }) {
  const { t, language } = useTranslation();
  const name = localize(service.name, service.nameEn, language);
  const description = service.description
    ? localize(service.description, service.descriptionEn, language)
    : null;
  const Icon = ADDON_ICONS[service.iconName] ?? Sparkles;

  return (
    <Link
      to="/"
      hash="find-your-ride"
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[var(--shadow-float)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-primary">
          {t("goairServices.from")} {formatUsd(service.priceUsd)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-sm font-bold text-primary sm:text-base">{name}</h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      <span className="text-xs font-semibold text-muted-foreground group-hover:text-accent">
        {t("goairServices.addAtBooking")}
      </span>
    </Link>
  );
}

export function GoairServicesSection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);

  const { data: allServices } = useQuery({
    queryKey: ["goair", "addon-services"],
    queryFn: fetchAddonServices,
  });

  // Highlighted services first (stable — keeps the DB sort_order inside each group).
  const sorted = useMemo(
    () =>
      [...(allServices ?? [])].sort((a, b) => Number(b.isHighlighted) - Number(a.isHighlighted)),
    [allServices],
  );

  const categoryLabels: Record<AddonServiceCategory, string> = {
    before_trip: t("booking.addonsStep.categories.before_trip"),
    luggage: t("booking.addonsStep.categories.luggage"),
    airport: t("booking.addonsStep.categories.airport"),
    destination: t("booking.addonsStep.categories.destination"),
  };

  const presentCategories = CATEGORY_ORDER.filter((c) => sorted.some((s) => s.category === c));
  const filtered = filter === "all" ? sorted : sorted.filter((s) => s.category === filter);
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const canExpand = filtered.length > INITIAL_VISIBLE;

  function selectFilter(next: Filter) {
    setFilter(next);
    setExpanded(false);
  }

  return (
    <section className="goair-section">
      <div className="goair-container">
        <SectionHeader
          title={t("goairServices.sectionTitle")}
          description={t("goairServices.sectionDescription")}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Core product — Airport Transfer stays the one large, image-led tile */}
          <Link
            to="/"
            hash="find-your-ride"
            className="group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] lg:col-span-1"
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

          {/* Add-on catalog — light cards, filtered by category, expandable */}
          <div className="lg:col-span-2">
            {presentCategories.length > 1 ? (
              <div
                role="tablist"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {(["all", ...presentCategories] as Filter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => selectFilter(key)}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
                      filter === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-primary",
                    )}
                  >
                    {key === "all" ? t("goairServices.all") : categoryLabels[key]}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {canExpand ? (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                >
                  {expanded ? t("goairServices.showLess") : t("goairServices.showMore")}
                  <ChevronDown
                    className={cn("size-4 transition-transform", expanded && "rotate-180")}
                    aria-hidden
                  />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
