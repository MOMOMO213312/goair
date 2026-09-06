import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Briefcase,
  Bus,
  Car,
  Caravan,
  Check,
  Clock,
  Compass,
  Crown,
  Gem,
  Luggage,
  Sparkles,
  Users,
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
import {
  fetchActivePackages,
  fetchSubscriptionPlans,
  fetchVehicleTypeMinPrices,
  fetchVehicleTypes,
  formatUsd,
  type PackageTier,
  type SubscriptionPlan,
} from "@/lib/goair";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "استكشف — GoAir" },
      {
        name: "description",
        content: "أحجام الرحلات، الباقات، والاشتراكات — كل حاجة GoAir بتقدمها في صفحة واحدة.",
      },
      { property: "og:title", content: "استكشف — GoAir" },
      { property: "og:description", content: "اختار حجم رحلتك، وضيف باقة، أو اشترك بخصم دائم." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <div>
      <ExploreHero />
      <ServicesBlock />
      <OffersBlock />
    </div>
  );
}

function ExploreHero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary to-violet-deep py-14 sm:py-20">
      <FlightPath className="pointer-events-none absolute inset-x-0 top-6 h-16 w-full text-accent/25 sm:top-10 sm:h-24 [stroke-dasharray:1200] [stroke-dashoffset:1200] motion-safe:animate-[draw-route_1.8s_ease-out_forwards]" />
      <div className="goair-container relative">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
          <Compass className="size-3.5 text-accent" aria-hidden />
          كل خدمة وكل عرض، في مكان واحد
        </p>
        <h1 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-[1.15] text-primary-foreground sm:text-5xl">
          استكشف GoAir
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          من اختيار حجم رحلتك، لباقات الراحة الإضافية، لعضوية بخصم دائم — شوف كل حاجة بنقدمها قبل ما تحجز.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------- خدماتنا ---------------------------------- */

const BLURB_BY_TIER: Record<string, string> = {
  small: "الأنسب للعائلات والمجموعات الصغيرة.",
  medium: "مساحة أكبر لمجموعات السياحة والشركات المتوسطة.",
  large: "أفضل خيار اقتصادي للمجموعات الكبيرة ورحلات الشركات.",
};

const ICON_BY_TIER: Record<string, typeof Car> = {
  small: Car,
  medium: Caravan,
  large: Bus,
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
 *
 * Cards sit along a single dashed route line — the same motif as the site's
 * flight-path graphics — so the three group sizes read as stops along one
 * trip rather than three interchangeable pricing tiles.
 */
function ServicesBlock() {
  const { data: vehicleTypes } = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const { data: minPrices } = useQuery({
    queryKey: ["goair", "vehicle-type-min-prices"],
    queryFn: fetchVehicleTypeMinPrices,
  });

  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  const cheapestId = minPrices
    ? Object.entries(minPrices).sort((a, b) => a[1] - b[1])[0]?.[0]
    : undefined;

  return (
    <section id="services" className="goair-section scroll-mt-20">
      <div className="goair-container">
        <SectionHeader
          title="اختار حسب حجم مجموعتك"
          description="السعر بيظهر بعد اختيار خط رحلتك — نفس مستوى الراحة والاستقبال لأي حجم."
        />

        <div className="relative mt-10">
          <div
            aria-hidden
            className="absolute inset-x-6 top-11 hidden border-t-2 border-dashed border-border sm:block"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {vehicleTypes.map((vehicle) => {
              const tier = tierFor(vehicle.capacity);
              const TierIcon = ICON_BY_TIER[tier] ?? Car;
              const dotCount = Math.min(vehicle.capacity, 6);
              const isLarge = tier === "large";
              const minPrice = minPrices?.[vehicle.id];
              const isCheapest = vehicle.id === cheapestId;

              return (
                <a
                  key={vehicle.id}
                  href="#find-your-ride"
                  className={cn(
                    "group relative flex flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1",
                    isLarge
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-float)] sm:scale-[1.04]"
                      : "border border-border bg-background text-primary shadow-sm",
                  )}
                >
                  {isCheapest ? (
                    <span
                      className={cn(
                        "absolute -top-3 right-6 z-10 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold",
                        isLarge ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
                      )}
                    >
                      الأوفر اقتصاديًا
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      "relative z-10 flex size-11 items-center justify-center rounded-full ring-4",
                      isLarge ? "bg-accent text-accent-foreground ring-primary" : "bg-secondary text-primary ring-background",
                    )}
                  >
                    <TierIcon className="size-5" aria-hidden />
                  </span>

                  <h3 className="mt-5 font-display text-lg font-extrabold">
                    لغاية {vehicle.capacity} راكب
                  </h3>
                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-relaxed",
                      isLarge ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {BLURB_BY_TIER[tier]}
                  </p>

                  {minPrice != null ? (
                    <p className="mt-4 flex items-baseline gap-1">
                      <span className={cn("text-xs font-bold", isLarge ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        من
                      </span>
                      <span className="font-display text-2xl font-extrabold">{formatUsd(minPrice)}</span>
                      <span className={cn("text-xs", isLarge ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        للمقعد
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-1.5">
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <Users key={i} className="size-3.5 text-accent" aria-hidden />
                    ))}
                    {vehicle.capacity > dotCount ? (
                      <span className="text-xs font-bold text-accent">+{vehicle.capacity - dotCount}</span>
                    ) : null}
                  </div>

                  {vehicle.maxLuggage != null ? (
                    <span
                      className={cn(
                        "mt-3 flex items-center gap-1.5 text-xs font-bold",
                        isLarge ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      <Briefcase className="size-4 text-accent" aria-hidden />
                      حتى {vehicle.maxLuggage} حقيبة
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      "mt-5 inline-flex w-fit items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                      isLarge
                        ? "bg-accent text-accent-foreground group-hover:bg-accent/90"
                        : "border border-border text-primary group-hover:bg-secondary",
                    )}
                  >
                    ابحث عن رحلتك
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- عروضنا ----------------------------------- */

const ICONS: Record<string, LucideIcon> = { Sparkles, Clock, Users, Crown, Award, Gem };
const SUB_COUNTRIES = ["مصر", "لبنان"];
const DURATION_LABEL: Record<string, string> = { semi_annual: "6 شهور", annual: "سنوي" };

function OffersBlock() {
  const [tab, setTab] = useState<"packages" | "subscriptions">("packages");
  const [subCountry, setSubCountry] = useState<string>(SUB_COUNTRIES[0] ?? "مصر");

  const { data: packages, isPending } = useQuery({ queryKey: ["goair", "packages"], queryFn: fetchActivePackages });
  const { data: plans, isPending: plansPending } = useQuery({
    queryKey: ["goair", "subscription-plans", subCountry],
    queryFn: () => fetchSubscriptionPlans(subCountry),
  });

  return (
    <section className="goair-section border-t border-border bg-mist/60">
      <div className="goair-container">
        <SectionHeader
          title="عروض GoAir"
          description="باقات إضافية لرحلة واحدة، أو اشتراك عضوية بخصم على كل رحلاتك."
        />

        <div className="mt-8 inline-flex w-fit rounded-lg border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setTab("packages")}
            className={cn(
              "rounded-md px-5 py-2 text-sm font-bold transition-colors",
              tab === "packages" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
            )}
          >
            باقات الرحلة
          </button>
          <button
            type="button"
            onClick={() => setTab("subscriptions")}
            className={cn(
              "rounded-md px-5 py-2 text-sm font-bold transition-colors",
              tab === "subscriptions" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
            )}
          >
            الاشتراكات
          </button>
        </div>

        {tab === "packages" ? (
          <>
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

            <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-center text-sm text-muted-foreground">
              <Luggage className="size-4 shrink-0" />
              الباقات دي إضافية فوق سعر المقعد الأساسي، وبتتضاف لإجمالي حجزك تلقائيًا.
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 flex justify-center sm:justify-start">
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

            {plansPending ? (
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

            <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-center text-sm text-muted-foreground">
              <Award className="size-4 shrink-0" />
              الاشتراك عضوية منفصلة عن الحجز — بعد الاشتراك هتاخد كود تتبع من صفحة "حجزي" (تبويب اشتراك).
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Dashed tear-line under the icon badge — a boarding-pass stub motif, not a generic card divider. */
function TicketRule({ tinted }: { tinted: boolean }) {
  return (
    <div
      className={cn(
        "mt-4 h-px w-full bg-[length:8px_1px] bg-repeat-x",
        tinted
          ? "opacity-40 [background-image:linear-gradient(90deg,currentColor_50%,transparent_0)]"
          : "text-border [background-image:linear-gradient(90deg,currentColor_50%,transparent_0)]",
      )}
      aria-hidden
    />
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
      <TicketRule tinted={plan.isHighlighted} />

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
      <TicketRule tinted={pkg.isHighlighted} />

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

      {/* Carries the chosen package all the way through search → book,
          where its price is added to the real total via create_booking_safe. */}
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
