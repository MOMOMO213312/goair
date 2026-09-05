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
      <div className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 py-4 sm:justify-center sm:px-6 sm:py-5">
            <item.icon className="size-5 shrink-0 text-accent" aria-hidden />
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
