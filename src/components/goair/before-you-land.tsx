import { PlaneLanding, ShieldCheck, UserRound } from "lucide-react";

import sedanImage from "@/assets/vehicle-sedan.jpg";
import { SectionHeader } from "@/components/goair/section-header";
import { useTopicPhoto } from "@/use-topic-photo";
import { cn } from "@/lib/utils";

type Card = {
  icon: typeof PlaneLanding;
  title: string;
  text: string;
  /** Local image (already GoAir's own asset) OR a Wikipedia topic to fetch a real photo for. Pass exactly one. */
  localImage?: string;
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
    topic: "Airport arrivals hall",
  },
  {
    icon: ShieldCheck,
    title: "عربية آمنة ومفحوصة",
    text: "كل عربية في أسطولنا متفحوصة ومؤمّنة، والسائق معاه بيانات حجزك من قبل ما توصل.",
    localImage: sedanImage,
  },
];

function CardImage({ card }: { card: Card }) {
  const fetched = useTopicPhoto(card.topic ?? "");
  const src = card.localImage ?? fetched;

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
