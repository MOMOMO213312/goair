import { BadgeCheck, CalendarX2, UserRound } from "lucide-react";

const items = [
  {
    icon: BadgeCheck,
    title: "سعر ثابت من أول لحظة",
    text: "السعر اللي تشوفه هو اللي هتدفعه — بدون مزايدة أو مفاجآت.",
  },
  {
    icon: CalendarX2,
    title: "إلغاء مجاني حتى 24 ساعة",
    text: "غيّرت رأيك؟ تقدر تلغي أو تعدّل مجانًا قبل الرحلة بيوم.",
  },
  {
    icon: UserRound,
    title: "استقبال بلافتة باسمك",
    text: "مندوب GoAir مستنيك في صالة الوصول بلافتة عليها اسمك.",
  },
];

/** Directly under the hero — the first trust signal a visitor sees. */
export function HeroTrustStrip() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3 sm:gap-6 sm:py-7">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <item.icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-primary">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
