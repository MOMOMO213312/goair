import { useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import heroImage from "@/assets/hero-goair-van.png";
import { AnnouncementTicker } from "@/components/goair/announcement-ticker";
import { BeforeYouLand } from "@/components/goair/before-you-land";
import { BusinessPromoBanner } from "@/components/goair/business-promo-banner";
import { CoverageCountriesSection } from "@/components/goair/coverage-countries-section";
import { DealsTeaser } from "@/components/goair/deals-teaser";
import { ExploreRoutesSection } from "@/components/goair/explore-routes-section";
import { HeroTrustStrip } from "@/components/goair/hero-trust-strip";
import { HeroImageCarousel } from "@/components/hero-image-carousel";
import { HowItWorks } from "@/components/goair/how-it-works";
import { SectionHeader } from "@/components/goair/section-header";
import { ServiceHighlights } from "@/components/goair/service-highlights";
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
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

// Real, freely-licensed (Unsplash) airport photos — same hotlinking pattern
// used for destination/generic photos in trip-media.ts. These replaced a
// promo graphic that had "goair — Move Beyond the Airport" baked into the
// image itself, which any hero overlay (search widget, title) inevitably
// covered no matter how it was positioned.
const heroTerminalImage =
  "https://images.unsplash.com/photo-1642035148715-7cc0c7538904?q=80&w=1920&auto=format&fit=crop";
const heroCurbsideImage =
  "https://images.unsplash.com/photo-1605407079290-c31423ab611a?q=80&w=1920&auto=format&fit=crop";

const marketsQuery = queryOptions({
  queryKey: ["goair", "markets"],
  queryFn: async () => {
    const trips = await fetchTrips();
    const countries = await fetchVisibleCountries(trips);
    return { trips, countries };
  },
});

// head() runs before the LanguageProvider mounts (it feeds <HeadContent /> in the
// shell), so it can't call useTranslation(). It always renders the default-language
// meta tags; that's an accepted v1 tradeoff (see MIGRATION_GUIDE.md → "SSR meta tags").
const homeMeta = translations[DEFAULT_LANGUAGE].home.meta;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: homeMeta.title },
      {
        name: "description",
        content: homeMeta.description,
      },
      { property: "og:title", content: homeMeta.title },
      {
        property: "og:description",
        content: homeMeta.ogDescription,
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(marketsQuery),
  component: Home,
  errorComponent: HomeErrorComponent,
});

function HomeErrorComponent() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-xl font-bold">{t("home.errorLoadingTrips.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("home.errorLoadingTrips.body")}</p>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(marketsQuery);
  const { trips, countries } = data;
  const { t } = useTranslation();

  const publicTrips = useMemo(() => filterPublicTrips(trips, countries), [trips, countries]);

  return (
    <>
      <AnnouncementTicker />

      {/* Hero + Search */}
      <section className="relative isolate overflow-hidden">
        <HeroImageCarousel
          slides={[
            { src: heroImage, alt: t("home.hero.imageAlt") },
            { src: heroTerminalImage, alt: t("home.hero.imageAlt") },
            { src: heroCurbsideImage, alt: t("home.hero.imageAlt") },
          ]}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent sm:from-ink/80 sm:via-ink/10" />
        <FlightPath className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-24 w-full text-accent/40 sm:top-16 sm:h-32 [stroke-dasharray:1200] [stroke-dashoffset:1200] motion-safe:animate-[draw-route_1.8s_ease-out_forwards]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pb-20 sm:pt-8">
          {/* Search dock — docked to the physical top-left corner of the hero
              photo. `ms-auto` (margin-inline-start) pushes it away from the
              RTL start edge (right) so it hugs the true left side, in normal
              document flow — no absolute positioning, so it can never
              overlap the title block below it. */}
          <div id="find-your-ride" className="mb-8 w-full max-w-sm ms-auto scroll-mt-24 sm:max-w-md">
            <SearchWidget trips={trips} countries={countries} />
          </div>

          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
              <Sparkles className="size-3.5 text-accent" />
              {t("home.hero.badge")}
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-primary-foreground sm:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
              {t("home.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-primary-foreground/15 pt-6">
              {[
                { value: `+${publicTrips.length}`, label: t("home.hero.statActiveRoutes") },
                {
                  value: String(countries.length),
                  label:
                    countries.length === 1
                      ? t("home.hero.statCountrySingular")
                      : t("home.hero.statCountryPlural"),
                },
                { value: "24/7", label: t("home.hero.statSupport") },
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
      </section>

      {/* Trust strip — directly under the hero, per Final Vision */}
      <div className="pt-10 sm:pt-8">
        <HeroTrustStrip />
      </div>

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
        <SectionHeader title={t("home.faq.title")} />
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="a">
            <AccordionTrigger>{t("home.faq.q1")}</AccordionTrigger>
            <AccordionContent>{t("home.faq.a1")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>{t("home.faq.q2")}</AccordionTrigger>
            <AccordionContent>{t("home.faq.a2")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>{t("home.faq.q3")}</AccordionTrigger>
            <AccordionContent>{t("home.faq.a3")}</AccordionContent>
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
