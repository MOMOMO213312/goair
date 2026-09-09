import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Check,
  Clock,
  Compass,
  Crown,
  Gem,
  Luggage,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { FlightPath } from "@/components/flight-path";
import { SectionHeader } from "@/components/goair/section-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStockPhoto } from "@/hooks/use-stock-photo";
import { EXPLORE_TAB_VALUES, type ExploreTab } from "@/lib/explore-tabs";
import {
  fetchActivePackages,
  fetchSubscriptionPlans,
  type PackageTier,
  type SubscriptionPlan,
} from "@/lib/goair";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize, localizeList } from "@/lib/i18n/localize";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].explorePage.meta;

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: EXPLORE_TAB_VALUES.includes(search["tab"] as ExploreTab)
      ? (search["tab"] as ExploreTab)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: pageMeta.title },
      {
        name: "description",
        content: pageMeta.description,
      },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { tab } = Route.useSearch();
  const activeTab: ExploreTab = tab ?? "packages";

  return (
    <div>
      {activeTab === "packages" ? <ExploreHero tab={activeTab} /> : null}
      {activeTab === "packages" ? <PackagesBlock /> : null}
      {activeTab === "subscriptions" ? <SubscriptionsBlock /> : null}
    </div>
  );
}

function ExploreHero({ tab }: { tab: ExploreTab }) {
  const { t } = useTranslation();
  const copy =
    tab === "packages"
      ? {
          eyebrow: t("explorePage.tabEyebrow"),
          title: t("explorePage.packagesHeroTitle"),
          description: t("explorePage.packagesHeroDescription"),
        }
      : {
          eyebrow: t("explorePage.tabEyebrow"),
          title: t("explorePage.subscriptionsHeroTitle"),
          description: t("explorePage.subscriptionsHeroDescription"),
        };
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary to-violet-deep py-14 sm:py-20">
      <img
        src="https://images.pexels.com/photos/32176066/pexels-photo-32176066.jpeg?auto=compress&cs=tinysrgb&w=1600"
        alt=""
        loading="eager"
        className="absolute inset-0 -z-10 size-full object-cover opacity-25"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/90 to-violet-deep/90" />
      <FlightPath className="pointer-events-none absolute inset-x-0 top-6 h-16 w-full text-accent/25 sm:top-10 sm:h-24 [stroke-dasharray:1200] [stroke-dashoffset:1200] motion-safe:animate-[draw-route_1.8s_ease-out_forwards]" />
      <div className="goair-container relative">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
          <Compass className="size-3.5 text-accent" aria-hidden />
          {copy.eyebrow}
        </p>
        <h1 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-[1.15] text-primary-foreground sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          {copy.description}
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------- الباقات ----------------------------------- */

const ICONS: Record<string, LucideIcon> = { Sparkles, Clock, UserRound, Crown, Award, Gem };

function PackagesBlock() {
  const { t } = useTranslation();
  const { data: packages, isPending } = useQuery({ queryKey: ["goair", "packages"], queryFn: fetchActivePackages });

  return (
    <section className="goair-section">
      <div className="goair-container">
        <SectionHeader title={t("explorePage.packagesHeroTitle")} description={t("explorePage.packagesSectionDescription")} />

        {isPending ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">{t("explorePage.packagesLoading")}</p>
        ) : !packages || packages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">{t("explorePage.noPackagesAvailable")}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-mist/60 px-4 py-3 text-center text-sm text-muted-foreground">
          <Luggage className="size-4 shrink-0" />
          {t("explorePage.packagesFootnote")}
        </div>
      </div>
    </section>
  );
}

function PackageCard({ pkg }: { pkg: PackageTier }) {
  const { t, language } = useTranslation();
  const name = localize(pkg.name, pkg.nameEn, language);
  const tagline = pkg.tagline ? localize(pkg.tagline, pkg.taglineEn, language) : null;
  const features = localizeList(pkg.features, pkg.featuresEn, language);
  const Icon = ICONS[pkg.iconName] ?? Sparkles;
  const photo = useStockPhoto("packages", pkg.id, pkg.imageUrl);
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border shadow-sm",
        pkg.isHighlighted
          ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
          : "border-border bg-card text-card-foreground",
      )}
    >
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
      {pkg.isHighlighted ? (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          {t("explorePage.mostRequested")}
        </span>
      ) : null}

      <span className={cn("flex size-11 items-center justify-center rounded-xl", pkg.isHighlighted ? "bg-primary-foreground/15" : "bg-secondary")}>
        <Icon className={cn("size-5", pkg.isHighlighted ? "text-accent" : "text-primary")} />
      </span>

      <h3 className="mt-4 font-display text-lg font-extrabold">{pkg.name}</h3>
      {pkg.tagline ? (
        <p className={cn("mt-1 text-sm", pkg.isHighlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{pkg.tagline}</p>
      ) : null}

      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-3xl font-extrabold">${pkg.priceUsd}</span>
        <span className={cn("text-sm", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>{t("explorePage.perTraveler")}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", pkg.isHighlighted ? "text-accent" : "text-primary")} />
            <span className={pkg.isHighlighted ? "text-primary-foreground/90" : "text-foreground/90"}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Own dedicated flow — never threaded through the normal search/book pages. */}
      <Button
        asChild
        className={cn("mt-6 w-full font-bold", pkg.isHighlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        <Link to="/package" search={{ packageId: pkg.id }}>
          {t("explorePage.choosePackageAndSearch")}
        </Link>
      </Button>
      <p className={cn("mt-2 text-center text-xs", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
        {t("explorePage.nextStepPackage")}
      </p>
      </div>
    </div>
  );
}

/* ---------------------------------- الاشتراكات ---------------------------------- */

const SUB_COUNTRIES = ["مصر", "لبنان"];

/** Group plans by tier so each tier shows once with its duration as a switch, not 6 flat cards. */
function groupPlansByTier(plans: SubscriptionPlan[]): { tier: string; byDuration: Record<string, SubscriptionPlan> }[] {
  const order: string[] = [];
  const map = new Map<string, Record<string, SubscriptionPlan>>();
  for (const plan of plans) {
    if (!map.has(plan.tier)) {
      map.set(plan.tier, {});
      order.push(plan.tier);
    }
    map.get(plan.tier)![plan.duration] = plan;
  }
  return order.map((tier) => ({ tier, byDuration: map.get(tier)! }));
}

function SubscriptionsBlock() {
  const { t } = useTranslation();
  const [subCountry, setSubCountry] = useState<string>(SUB_COUNTRIES[0] ?? "مصر");
  const [duration, setDuration] = useState<string>("annual");
  const { data: plans, isPending } = useQuery({
    queryKey: ["goair", "subscription-plans", subCountry],
    queryFn: () => fetchSubscriptionPlans(subCountry),
  });

  const tiers = plans ? groupPlansByTier(plans) : [];
  const availableDurations = plans ? Array.from(new Set(plans.map((p) => p.duration))) : [];
  const durationLabel: Record<string, string> = {
    semi_annual: t("explorePage.durationSemiAnnual"),
    annual: t("explorePage.durationAnnual"),
  };

  return (
    <>
      {/* Membership hero — large premium visual, not a SaaS pricing header. */}
      <section className="relative isolate overflow-hidden">
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <img
            src="https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            loading="eager"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/20" />
        </div>
        <div className="goair-container -mt-20 relative pb-4 sm:-mt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-primary/80 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur">
            <Crown className="size-3.5 text-accent" aria-hidden />
            {t("explorePage.membershipBadge")}
          </div>
          <h2 className="mt-3 max-w-lg font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
            {t("explorePage.membershipHeroTitle")}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-primary-foreground/85">
            {t("explorePage.membershipHeroDescription")}
          </p>
        </div>
      </section>

      <section className="goair-section pt-6 sm:pt-8">
        <div className="goair-container">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHeader title={t("explorePage.choosePlanTitle")} description={t("explorePage.choosePlanDescription")} />
            <div className="flex flex-wrap items-center gap-2">
              {availableDurations.length > 1 ? (
                <div className="flex rounded-full border border-border bg-mist/60 p-1">
                  {availableDurations
                    .sort((a) => (a === "annual" ? -1 : 1))
                    .map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                          duration === d ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
                        )}
                      >
                        {durationLabel[d] ?? d}
                      </button>
                    ))}
                </div>
              ) : null}
              <Select value={subCountry} onValueChange={setSubCountry}>
                <SelectTrigger className="h-10 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPending ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">{t("explorePage.subscriptionsLoading")}</p>
          ) : tiers.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">{t("explorePage.noSubscriptionsInCountry")}</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map(({ tier, byDuration }) => {
                const plan = byDuration[duration] ?? Object.values(byDuration)[0];
                if (!plan) return null;
                return <SubscriptionPlanCard key={tier} plan={plan} durationLabel={durationLabel} />;
              })}
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-mist/60 px-4 py-3 text-center text-sm text-muted-foreground">
            <Award className="size-4 shrink-0" />
            {t("explorePage.subscriptionFootnote")}
          </div>
        </div>
      </section>
    </>
  );
}

function SubscriptionPlanCard({ plan, durationLabel }: { plan: SubscriptionPlan; durationLabel: Record<string, string> }) {
  const { t } = useTranslation();
  const Icon = ICONS[plan.iconName] ?? Sparkles;
  const photo = useStockPhoto("subscription_plans", plan.id, plan.imageUrl);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border shadow-sm",
        plan.isHighlighted
          ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
          : "border-border bg-card text-card-foreground",
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className={cn("size-full", plan.isHighlighted ? "bg-primary-foreground/10" : "bg-secondary")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {plan.isHighlighted ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {t("explorePage.mostSavings")}
          </span>
        ) : null}

        <span className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
          <Icon className="size-4.5 text-white" />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-lg font-extrabold text-white">{plan.name}</h3>
          {plan.tagline ? <p className="mt-0.5 text-xs text-white/80">{plan.tagline}</p> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-extrabold">${plan.priceUsd}</span>
          <span className={cn("text-sm", plan.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
            / {durationLabel[plan.duration] ?? plan.duration}
          </span>
        </p>

        <ul className="mt-5 flex-1 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
            <span>{t("explorePage.discountOnAllTrips", { percent: plan.discountPercent })}</span>
          </li>
          {plan.freeRideCredits > 0 ? (
            <li className="flex items-start gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
              <span>{plan.freeRideCredits} {t("explorePage.freeRideSingular")}</span>
            </li>
          ) : null}
          <li className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
            <span>{plan.extraLuggagePieces} {t("explorePage.extraLuggagePerTrip")}</span>
          </li>
          {plan.guaranteedSeat ? (
            <li className="flex items-start gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
              <span>{t("explorePage.guaranteedSeat")}</span>
            </li>
          ) : null}
          {plan.prioritySupport ? (
            <li className="flex items-start gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
              <span>{t("explorePage.prioritySupport")}</span>
            </li>
          ) : null}
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
              <span className={plan.isHighlighted ? "text-primary-foreground/90" : "text-foreground/90"}>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          asChild
          className={cn("mt-6 w-full font-bold", plan.isHighlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          <Link to="/subscribe" search={{ planId: plan.id }}>
            {t("explorePage.subscribeNow")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
