import { PlaneLanding, ShieldCheck, UserRound } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useTranslation } from "@/lib/i18n/language-context";
import { useTopicPhoto } from "@/use-topic-photo";
import { cn } from "@/lib/utils";

type Card = {
  icon: typeof PlaneLanding;
  key: "flightTracking" | "namedPickup" | "safeVehicle";
  /** Real, freely-licensed hotlinked photo (curated) OR a Wikipedia topic to fetch a real photo for at runtime. Pass exactly one. */
  photo?: string;
  topic?: string;
};

const CARDS: Card[] = [
  {
    icon: PlaneLanding,
    key: "flightTracking",
    // Modern departure-board terminal (Pexels, free license) — curated
    // and reliable, unlike a runtime Wikipedia topic fetch which could
    // surface an unrelated or off-brand board photo.
    photo: "https://images.pexels.com/photos/12717154/pexels-photo-12717154.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    icon: UserRound,
    key: "namedPickup",
    // Professional chauffeur beside a private vehicle (Pexels, free license) —
    // reads as an international private-transfer service rather than a
    // casual traveler photo.
    photo: "https://images.pexels.com/photos/36377051/pexels-photo-36377051.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    icon: ShieldCheck,
    key: "safeVehicle",
    // Replaces vehicle-sedan.jpg, which read as a lookalike of a real car
    // grille (brand risk) — this is a generic private-ride photo instead
    // (Pexels, free license), matching the "safe, checked private car" idea
    // without implying a specific make.
    photo: "https://images.pexels.com/photos/29112731/pexels-photo-29112731.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

function CardImage({ card, alt }: { card: Card; alt: string }) {
  const fetched = useTopicPhoto(card.topic ?? "");
  const src = card.photo ?? fetched;

  if (!src) {
    return (
      <div className="aspect-[4/3] w-full animate-pulse rounded-t-2xl bg-secondary" aria-hidden />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-t-2xl object-cover"
    />
  );
}

/**
 * "قبل ما تنزل، كل حاجة جاهزة" — walks through the arrival experience with
 * real photos instead of just icons, right before the vehicle-choice section.
 */
export function BeforeYouLand() {
  const { t } = useTranslation();
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title={t("beforeYouLand.sectionTitle")}
          description={t("beforeYouLand.sectionDescription")}
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {CARDS.map((card) => {
            const title = t(`beforeYouLand.${card.key}.title`);
            return (
              <div
                key={card.key}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
                )}
              >
                <CardImage card={card} alt={title} />
                <div className="flex flex-1 flex-col p-5">
                  <card.icon className="size-6 text-accent" aria-hidden />
                  <h3 className="mt-3 font-display text-base font-bold text-primary">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`beforeYouLand.${card.key}.text`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
