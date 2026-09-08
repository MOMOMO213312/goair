import { Link } from "@tanstack/react-router";
import { ArrowLeft, PlaneLanding, PlaneTakeoff, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useTranslation } from "@/lib/i18n/language-context";

type ExperienceCard = {
  key: string;
  icon: typeof PlaneTakeoff;
  titleKey: "travelExperience.departing.title" | "travelExperience.arriving.title" | "travelExperience.services.title";
  descriptionKey:
    | "travelExperience.departing.description"
    | "travelExperience.arriving.description"
    | "travelExperience.services.description";
  ctaKey: "travelExperience.departing.cta" | "travelExperience.arriving.cta" | "travelExperience.services.cta";
  image: string;
  to: string;
  hash?: string;
  search?: Record<string, string>;
};

const CARDS: ExperienceCard[] = [
  {
    key: "departing",
    icon: PlaneTakeoff,
    titleKey: "travelExperience.departing.title",
    descriptionKey: "travelExperience.departing.description",
    ctaKey: "travelExperience.departing.cta",
    image:
      "https://images.pexels.com/photos/32176053/pexels-photo-32176053.jpeg?auto=compress&cs=tinysrgb&w=1200",
    to: "/",
    hash: "find-your-ride",
  },
  {
    key: "arriving",
    icon: PlaneLanding,
    titleKey: "travelExperience.arriving.title",
    descriptionKey: "travelExperience.arriving.description",
    ctaKey: "travelExperience.arriving.cta",
    image:
      "https://images.pexels.com/photos/1730814/pexels-photo-1730814.jpeg?auto=compress&cs=tinysrgb&w=1200",
    to: "/",
    hash: "find-your-ride",
  },
  {
    key: "services",
    icon: Sparkles,
    titleKey: "travelExperience.services.title",
    descriptionKey: "travelExperience.services.description",
    ctaKey: "travelExperience.services.cta",
    image:
      "https://images.pexels.com/photos/13315324/pexels-photo-13315324.jpeg?auto=compress&cs=tinysrgb&w=1200",
    to: "/explore",
    search: { tab: "packages" },
  },
];

/**
 * "اختار تجربة رحلتك" — three large, image-led cards right under the hero
 * that route the customer into the right flow (departing / arriving / airport
 * services) before they touch the search form. Per the GOAIR image-system
 * spec: real Pexels photography, not icon-only cards.
 */
export function TravelExperienceSection() {
  const { t } = useTranslation();
  return (
    <section className="goair-section pt-12 sm:pt-16">
      <div className="goair-container">
        <SectionHeader
          title={t("travelExperience.sectionTitle")}
          description={t("travelExperience.sectionDescription")}
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.key}
              to={card.to}
              {...(card.hash ? { hash: card.hash } : {})}
              {...(card.search ? { search: card.search } : {})}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <img
                src={card.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

              <div className="p-5 sm:p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <card.icon className="size-5 text-white" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-xl font-extrabold text-white">
                  {t(card.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                  {t(card.descriptionKey)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                  {t(card.ctaKey)}
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
