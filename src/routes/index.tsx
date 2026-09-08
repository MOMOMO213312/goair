import { useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import heroAirportImage from "@/assets/hero-airport.jpg";
import heroImage from "@/assets/hero-goair-van.png";
import routeEgyptImage from "@/assets/route-egypt.jpg";
import routeLebanonImage from "@/assets/route-lebanon.jpg";
import { AnnouncementTicker } from "@/components/goair/announcement-ticker";
import { BeforeYouLand } from "@/components/goair/before-you-land";
import { BusinessPromoBanner } from "@/components/goair/business-promo-banner";
import { CoverageCountriesSection } from "@/components/goair/coverage-countries-section";
import { DealsTeaser } from "@/components/goair/deals-teaser";
import { ExploreRoutesSection } from "@/components/goair/explore-routes-section";
import { HeroBackgroundCarousel } from "@/components/goair/hero-background-carousel";
import { HeroTrustStrip } from "@/components/goair/hero-trust-strip";
import { HowItWorks } from "@/components/goair/how-it-works";
import { SectionHeader } from "@/components/goair/section-header";
import { ServiceHighlights } from "@/components/goair/service-highlights";
import { TravelExperienceSection } from "@/components/goair/travel-experience-section";
import { FlightPath } from "@/components/flight-path";
import { SearchWidget } from "@/components/search-widget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchTrips, fetchVisibleCountries } from "@/lib/goair";
import { filterPublicTrips } from "@/lib/trip-stats";

const marketsQuery = queryOptions({
  queryKey: ["goair", "markets"],
  queryFn: async () => {
    const trips = await fetchTrips();
    const countries = await fetchVisibleCountries(trips);
    return { trips, countries };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoAir — نقل مشترك من وإلى المطار في مصر ولبنان" },
      {
        name: "description",
        content:
          "احجز مقعدك في نقل مشترك من وإلى مطارات مصر ولبنان: سعر ثابت لكل مقعد، مواعيد ثابتة، واستقبال خارج المطار.",
      },
      { property: "og:title", content: "GoAir — نقل مشترك من وإلى المطار" },
      {
        property: "og:description",
        content: "سعر ثابت، مواعيد معروفة، واستقبال خارج المطار بدون مفاوضات.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(marketsQuery),
  component: Home,
  errorComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-xl font-bold">مش قادرين نحمّل الخطوط دلوقتي</h1>
      <p className="mt-2 text-sm text-muted-foreground">جرّب تحديث الصفحة بعد لحظات.</p>
    </div>
  ),
});

function Home() {
  const { data } = useSuspenseQuery(marketsQuery);
  const { trips, countries } = data;

  const publicTrips = useMemo(() => filterPublicTrips(trips, countries), [trips, countries]);

  return (
    <>
      <AnnouncementTicker />

      {/* Hero + Search */}
      <section className="relative isolate overflow-hidden lg:overflow-visible lg:min-h-[720px]">
        <HeroBackgroundCarousel
          images={[heroImage, heroAirportImage, routeEgyptImage, routeLebanonImage]}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent sm:from-ink/80 sm:via-ink/10" />
        <FlightPath className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-24 w-full text-accent/40 sm:top-16 sm:h-32 [stroke-dasharray:1200] [stroke-dashoffset:1200] motion-safe:animate-[draw-route_1.8s_ease-out_forwards]" />

        {/* Anchor kept separate from either search UI below so the hash link
            in TravelExperienceSection has one stable target regardless of
            which search layout (floating desktop card vs. stacked mobile
            block) is visible at the current breakpoint. */}
        <div id="find-your-ride" className="absolute top-0 h-0 scroll-mt-24" />

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
              <Sparkles className="size-3.5 text-accent" />
              مصر ولبنان — متاح الآن
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-primary-foreground sm:text-6xl">
              رحلتك تبدأ من هنا
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
              حلول سفر متكاملة مصممة لكل رحلة
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-primary-foreground/15 pt-6">
              {[
                { value: `+${publicTrips.length}`, label: "خط رحلة نشط" },
                {
                  value: String(countries.length),
                  label: countries.length === 1 ? "دولة متاحة الآن" : "دول متاحة الآن",
                },
                { value: "24/7", label: "دعم متواصل" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-primary-foreground/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: compact search card floats over the left side of the hero
            photo (the side the headline text doesn't occupy in RTL), instead
            of a full-width bar stretching across it. */}
        <div className="pointer-events-none absolute left-6 top-10 z-10 hidden w-[340px] lg:flex xl:left-10 xl:w-[360px]">
          <div className="pointer-events-auto w-full">
            <SearchWidget trips={trips} countries={countries} compact />
          </div>
        </div>
      </section>

      {/* Mobile/tablet: search sits right under the hero photo as a full-width
          block, since the floating compact card is desktop-only. */}
      <div className="relative z-10 mx-auto -mt-6 max-w-3xl px-4 sm:-mt-8 lg:hidden">
        <SearchWidget trips={trips} countries={countries} />
      </div>

      {/* Trust strip — directly under the hero, per Final Vision */}
      <div className="pt-10 sm:pt-8">
        <HeroTrustStrip />
      </div>

      {/* اختار تجربة رحلتك — three large image-led cards routing into the
          right flow before the customer touches the search form. */}
      <TravelExperienceSection />

      {/* Explore routes — one merged section (was: popular routes + by-airport grid +
          destinations grid, three views of the same data). Filterable by airport. */}
      <ExploreRoutesSection trips={trips} countries={countries} />

      {/* How GoAir works */}
      <HowItWorks />

      {/* Before you land — walks through the arrival experience with real photos */}
      <BeforeYouLand />

      {/* Operational highlights */}
      <ServiceHighlights />

      {/* GOAIR Deals — teaser for the real packages/add-ons page */}
      <DealsTeaser />

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
        <SectionHeader title="أسئلة سريعة" />
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="a">
            <AccordionTrigger>هأقابل السائق فين؟</AccordionTrigger>
            <AccordionContent>
              نقطة التقاء واضحة خارج المطار — التفاصيل تظهر في تذكرتك بعد تأكيد الحجز.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>السعر بيتغير؟</AccordionTrigger>
            <AccordionContent>
              السعر المعروض لكل مقعد ثابت — ما تشوفش سعر مختلف عند الدفع.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>ازاي أتابع حجزي؟</AccordionTrigger>
            <AccordionContent>
              من صفحة «حجوزاتي» — اكتب كود التذكرة اللي استلمته بعد الحجز.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Countries GoAir covers today — real footprint, not a borrowed big number */}
      <CoverageCountriesSection trips={trips} countries={countries} />

      {/* For travel agencies & airlines */}
      <BusinessPromoBanner />
    </>
  );
}
