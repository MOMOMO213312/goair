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
import { EXPLORE_TAB_VALUES, type ExploreTab } from "@/lib/explore-tabs";
import {
  fetchActivePackages,
  fetchSubscriptionPlans,
  type PackageTier,
  type SubscriptionPlan,
} from "@/lib/goair";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: EXPLORE_TAB_VALUES.includes(search["tab"] as ExploreTab)
      ? (search["tab"] as ExploreTab)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "استكشف — GoAir" },
      {
        name: "description",
        content: "خدمات إضافية، باقات، واشتراكات — كل حاجة GoAir بتقدمها لرحلتك، في صفحة واحدة.",
      },
      { property: "og:title", content: "استكشف — GoAir" },
      { property: "og:description", content: "ضيف الراحة اللي محتاجها لرحلتك، أو اشترك بخصم دائم." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { tab } = Route.useSearch();
  const activeTab: ExploreTab = tab ?? "packages";

  return (
    <div>
      <ExploreHero tab={activeTab} />
      {activeTab === "packages" ? <PackagesBlock /> : null}
      {activeTab === "subscriptions" ? <SubscriptionsBlock /> : null}
    </div>
  );
}

const TAB_HERO_COPY: Record<ExploreTab, { eyebrow: string; title: string; description: string }> = {
  packages: {
    eyebrow: "كل خدمة وكل عرض، في مكان واحد",
    title: "باقات الرحلة",
    description: "باقات جاهزة بتضم أكتر من خدمة مع بعض، بسعر أوفر من اختيارها لوحدها.",
  },
  subscriptions: {
    eyebrow: "كل خدمة وكل عرض، في مكان واحد",
    title: "الاشتراكات",
    description: "عضوية بخصم دائم على كل رحلاتك — اشترك مرة واستفاد كل رحلة.",
  },
};

function ExploreHero({ tab }: { tab: ExploreTab }) {
  const copy = TAB_HERO_COPY[tab];
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
  const { data: packages, isPending } = useQuery({ queryKey: ["goair", "packages"], queryFn: fetchActivePackages });

  return (
    <section className="goair-section">
      <div className="goair-container">
        <SectionHeader title="باقات الرحلة" description="باقات إضافية فوق سعر المقعد الأساسي، بتتضاف تلقائيًا لحجزك." />

        {isPending ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">جاري تحميل الباقات...</p>
        ) : !packages || packages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">مفيش باقات متاحة دلوقتي.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-mist/60 px-4 py-3 text-center text-sm text-muted-foreground">
          <Luggage className="size-4 shrink-0" />
          الباقات دي إضافية فوق سعر المقعد الأساسي، وبتتضاف لإجمالي حجزك تلقائيًا.
        </div>
      </div>
    </section>
  );
}

function PackageCard({ pkg }: { pkg: PackageTier }) {
  const Icon = ICONS[pkg.iconName] ?? Sparkles;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-6 shadow-sm",
        pkg.isHighlighted
          ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
          : "border-border bg-card text-card-foreground",
      )}
    >
      {pkg.isHighlighted ? (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          الأكثر طلبًا
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
        <span className={cn("text-sm", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>لكل مسافر</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", pkg.isHighlighted ? "text-accent" : "text-primary")} />
            <span className={pkg.isHighlighted ? "text-primary-foreground/90" : "text-foreground/90"}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Carries the chosen package through search → book, where its
          price replaces the per-seat price via create_booking_safe. */}
      <Button
        asChild
        className={cn("mt-6 w-full font-bold", pkg.isHighlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        <Link to="/" search={{ packageId: pkg.id }} hash="find-your-ride">
          اختار الباقة دي وابحث عن رحلتك
        </Link>
      </Button>
      <p className={cn("mt-2 text-center text-xs", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
        الخطوة الجاية: اختار رحلتك، والباقة هتتضاف تلقائيًا
      </p>
    </div>
  );
}

/* ---------------------------------- الاشتراكات ---------------------------------- */

const SUB_COUNTRIES = ["مصر", "لبنان"];
const DURATION_LABEL: Record<string, string> = { semi_annual: "6 شهور", annual: "سنوي" };

function SubscriptionsBlock() {
  const [subCountry, setSubCountry] = useState<string>(SUB_COUNTRIES[0] ?? "مصر");
  const { data: plans, isPending } = useQuery({
    queryKey: ["goair", "subscription-plans", subCountry],
    queryFn: () => fetchSubscriptionPlans(subCountry),
  });

  return (
    <section className="goair-section">
      <div className="goair-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader title="الاشتراكات" description="عضوية بخصم دائم على كل رحلاتك." />
          <Select value={subCountry} onValueChange={setSubCountry}>
            <SelectTrigger className="h-10 w-48">
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

        {isPending ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">جاري تحميل الاشتراكات...</p>
        ) : !plans || plans.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">مفيش اشتراكات متاحة في الدولة دي دلوقتي.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <SubscriptionPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-mist/60 px-4 py-3 text-center text-sm text-muted-foreground">
          <Award className="size-4 shrink-0" />
          الاشتراك عضوية منفصلة عن الحجز — بعد الاشتراك هتاخد كود تتبع من صفحة "حجزي" (تبويب اشتراك).
        </div>
      </div>
    </section>
  );
}

function SubscriptionPlanCard({ plan }: { plan: SubscriptionPlan }) {
  const Icon = ICONS[plan.iconName] ?? Sparkles;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-6 shadow-sm",
        plan.isHighlighted
          ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
          : "border-border bg-card text-card-foreground",
      )}
    >
      {plan.isHighlighted ? (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          الأكثر توفيرًا
        </span>
      ) : null}

      <span className={cn("flex size-11 items-center justify-center rounded-xl", plan.isHighlighted ? "bg-primary-foreground/15" : "bg-secondary")}>
        <Icon className={cn("size-5", plan.isHighlighted ? "text-accent" : "text-primary")} />
      </span>

      <h3 className="mt-4 font-display text-lg font-extrabold">{plan.name}</h3>
      {plan.tagline ? (
        <p className={cn("mt-1 text-sm", plan.isHighlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.tagline}</p>
      ) : null}

      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-3xl font-extrabold">${plan.priceUsd}</span>
        <span className={cn("text-sm", plan.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
          / {DURATION_LABEL[plan.duration] ?? plan.duration}
        </span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
          <span>خصم {plan.discountPercent}% على كل رحلاتك</span>
        </li>
        {plan.freeRideCredits > 0 ? (
          <li className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
            <span>{plan.freeRideCredits} رحلة مجانية</span>
          </li>
        ) : null}
        <li className="flex items-start gap-2">
          <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
          <span>{plan.extraLuggagePieces} حقيبة إضافية لكل رحلة</span>
        </li>
        {plan.guaranteedSeat ? (
          <li className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
            <span>مقعد مضمون حتى في أوقات الزحمة</span>
          </li>
        ) : null}
        {plan.prioritySupport ? (
          <li className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", plan.isHighlighted ? "text-accent" : "text-primary")} />
            <span>دعم عملاء بأولوية</span>
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
          اشترك الآن
        </Link>
      </Button>
    </div>
  );
}
