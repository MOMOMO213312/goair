import { useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import heroImage from "@/assets/hero-goair-van.png";
import { AirportGrid } from "@/components/goair/airport-card";
import { AnnouncementTicker } from "@/components/goair/announcement-ticker";
import { BrandTrustStrip } from "@/components/goair/brand-trust-strip";
import { BusinessPromoBanner } from "@/components/goair/business-promo-banner";
import { CountryExploreCard } from "@/components/goair/country-explore-card";
import { DestinationCard } from "@/components/goair/destination-card";
import { EmptyState } from "@/components/goair/empty-state";
import { HeroTrustStrip } from "@/components/goair/hero-trust-strip";
import { RideTypesSection } from "@/components/goair/ride-types-section";
import { RouteCard } from "@/components/goair/route-card";
import { SectionHeader } from "@/components/goair/section-header";
import { ServiceHighlights } from "@/components/goair/service-highlights";
import { WhyGoAir } from "@/components/goair/why-goair";
import { FlightPath } from "@/components/flight-path";
import { SearchWidget } from "@/components/search-widget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchTrips, fetchVisibleCountries } from "@/lib/goair";
import {
  getAirportSummaries,
  getCountrySummaries,
  getDestinationSummaries,
  getFeaturedRoutes,
  filterPublicTrips,
} from "@/lib/trip-stats";

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

  const publicTrips = useMemo(
    () => filterPublicTrips(trips, countries),
    [trips, countries],
  );

  const featuredRoutes = useMemo(
    () => getFeaturedRoutes(trips, countries, 8),
    [trips, countries],
  );

  const airports = useMemo(
    () => getAirportSummaries(publicTrips).filter((a) => countries.includes(a.country)),
    [publicTrips, countries],
  );

  const countrySummaries = useMemo(
    () => getCountrySummaries(publicTrips, countries),
    [publicTrips, countries],
  );

  const destinations = useMemo(
    () => getDestinationSummaries(trips, countries),
    [trips, countries],
  );

  const sampleDestinationsByAirport = useMemo(() => {
    const map: Record<string, string> = {};
    for (const trip of publicTrips) {
      if (!map[trip.airport_code]) map[trip.airport_code] = trip.destination;
    }
    return map;
  }, [publicTrips]);

  const sampleByCountry = useMemo(() => {
    const map: Record<string, { destination: string; airport: string }> = {};
    for (const trip of publicTrips) {
      if (!map[trip.country]) {
        map[trip.country] = { destination: trip.destination, airport: trip.airport_code };
      }
    }
    return map;
  }, [publicTrips]);

  return (
    <>
      <AnnouncementTicker />

      {/* Hero + Search */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="مدرج مطار وقت الغروب"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-primary/95 via-primary/85 to-primary/70" />
        <FlightPath className="pointer-events-none absolute inset-x-0 top-8 -z-10 h-28 w-full text-accent/35 sm:top-12 sm:h-32" />

        <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pb-20 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-primary-foreground">
            <Sparkles className="size-3.5 text-accent" />
            مصر ولبنان — متاح الآن
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.15] text-primary-foreground sm:text-5xl">
            شبكة واحدة تعمل من أجل راحتك
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
            حلول سفر متكاملة مصممة لكل رحلة
          </p>

          <div id="find-your-ride" className="mt-8 max-w-4xl scroll-mt-24">
            <SearchWidget trips={trips} countries={countries} />
          </div>
        </div>
      </section>

      {/* Trust strip — directly under the hero, per Final Vision */}
      <HeroTrustStrip />

      {/* Choose your ride — real vehicle tiers from vehicle_types */}
      <RideTypesSection />

      {/* Operational highlights */}
      <ServiceHighlights />

      {/* Available routes */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader
            title="استكشف شبكة خطوطنا من أجل راحتك"
            description="خطوطنا تنشط في مصر ولبنان بأسعار ثابتة لكل مقعد من وإلى المطار"
          />

          {featuredRoutes.length > 0 ? (
            <>
              <div className="mt-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
                {featuredRoutes.map((trip) => (
                  <RouteCard key={trip.id} trip={trip} compact />
                ))}
              </div>
              <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
                {featuredRoutes.map((trip) => (
                  <RouteCard key={trip.id} trip={trip} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              className="mt-8"
              title="لا توجد خطوط معروضة حاليًا"
              description="جرّب تحديث الصفحة أو تواصل معنا للاستفسار."
            />
          )}
        </div>
      </section>

      <AirportGrid airports={airports} sampleDestinations={sampleDestinationsByAirport} />

      {/* Explore by country */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader
            title="استكشف حسب الدولة"
            description="مصر ولبنان — عدد الخطوط محسوب من الرحلات النشطة في المنصة."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {countrySummaries.map((summary) => (
              <CountryExploreCard
                key={summary.country}
                summary={summary}
                sampleDestination={sampleByCountry[summary.country]?.destination ?? ""}
                sampleAirport={sampleByCountry[summary.country]?.airport ?? ""}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Destinations grid */}
      <section className="bg-mist/60 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader
            title="وجهات مميزة"
            description="كل الوجهات المتاحة من وإلى المطار — بسعر ثابت لكل مقعد."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((item) => (
              <DestinationCard
                key={`${item.country}-${item.name}`}
                destination={item}
              />
            ))}
          </div>
        </div>
      </section>

      <WhyGoAir />

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

      {/* For travel agencies & airlines */}
      <BusinessPromoBanner />

      {/* Closing brand trust */}
      <BrandTrustStrip />
    </>
  );
}
