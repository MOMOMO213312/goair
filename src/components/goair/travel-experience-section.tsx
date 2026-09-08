import { Link } from "@tanstack/react-router";
import { ArrowLeft, PlaneLanding, PlaneTakeoff, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";

type ExperienceCard = {
  key: string;
  icon: typeof PlaneTakeoff;
  title: string;
  description: string;
  image: string;
  cta: string;
  to: string;
  hash?: string;
  search?: Record<string, string>;
};

const CARDS: ExperienceCard[] = [
  {
    key: "departing",
    icon: PlaneTakeoff,
    title: "أنا مسافر",
    description: "من موقعك إلى المطار — احجز مقعدك بسعر ثابت وموعد معروف.",
    image:
      "https://images.pexels.com/photos/32176053/pexels-photo-32176053.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cta: "ابحث عن رحلتك",
    to: "/",
    hash: "find-your-ride",
  },
  {
    key: "arriving",
    icon: PlaneLanding,
    title: "أنا واصل",
    description: "من المطار إلى وجهتك — مندوب GoAir مستنيك بلافتة عليها اسمك.",
    image:
      "https://images.pexels.com/photos/1730814/pexels-photo-1730814.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cta: "ابحث عن رحلتك",
    to: "/",
    hash: "find-your-ride",
  },
  {
    key: "services",
    icon: Sparkles,
    title: "خدمات المطار",
    description: "كل ما تحتاجه داخل المطار — Fast Track، صالة VIP، ومساعدة شخصية.",
    image:
      "https://images.pexels.com/photos/13315324/pexels-photo-13315324.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cta: "استكشف الخدمات",
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
  return (
    <section className="goair-section pt-12 sm:pt-16">
      <div className="goair-container">
        <SectionHeader
          title="اختار تجربة رحلتك"
          description="ثلاث طرق بسيطة تبدأ بيها — كل واحدة بتوديك على طول للي محتاجه."
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
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/80">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                  {card.cta}
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
