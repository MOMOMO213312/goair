import { PlaneLanding, ShieldCheck, UserRound } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useTopicPhoto } from "@/use-topic-photo";
import { cn } from "@/lib/utils";

type Card = {
  icon: typeof PlaneLanding;
  title: string;
  text: string;
  /** Real, freely-licensed hotlinked photo (curated) OR a Wikipedia topic to fetch a real photo for at runtime. Pass exactly one. */
  photo?: string;
  topic?: string;
};

const CARDS: Card[] = [
  {
    icon: PlaneLanding,
    title: "بنتابع رحلتك أول بأول",
    text: "بنراقب موعد هبوط طيارتك الفعلي، مش الجدول بس — لو الرحلة اتأخرت، السائق مستنيك برضو.",
    topic: "Flight information display system",
  },
  {
    icon: UserRound,
    title: "استقبال بلافتة باسمك",
    text: "تخرج من صالة الوصول تلاقي مندوب GoAir واقف بلافتة عليها اسمك — من غير ما تدوّر أو تتصل بحد.",
    // Traveler waiting at the terminal with luggage (Pexels, free license) —
    // curated and reliable, unlike the runtime Wikipedia topic fetch above.
    photo: "https://images.pexels.com/photos/32176145/pexels-photo-32176145.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    icon: ShieldCheck,
    title: "عربية آمنة ومفحوصة",
    text: "كل عربية في أسطولنا متفحوصة ومؤمّنة، والسائق معاه بيانات حجزك من قبل ما توصل.",
    // Replaces vehicle-sedan.jpg, which read as a lookalike of a real car
    // grille (brand risk) — this is a generic private-ride photo instead
    // (Pexels, free license), matching the "safe, checked private car" idea
    // without implying a specific make.
    photo: "https://images.pexels.com/photos/29112731/pexels-photo-29112731.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

function CardImage({ card }: { card: Card }) {
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
      alt={card.title}
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
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title="قبل ما تنزل، كل حاجة جاهزة"
          description="من لحظة ما الطيارة تلمس المدرج، إحنا خطوة قبلك."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
              )}
            >
              <CardImage card={card} />
              <div className="flex flex-1 flex-col p-5">
                <card.icon className="size-6 text-accent" aria-hidden />
                <h3 className="mt-3 font-display text-base font-bold text-primary">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
