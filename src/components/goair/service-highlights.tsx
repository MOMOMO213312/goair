import { Clock, Headset, PlaneTakeoff, Smartphone } from "lucide-react";

const ITEMS = [
  { icon: PlaneTakeoff, title: "متابعة رحلتك", text: "بنتابع موعد هبوط طيارتك أول بأول" },
  { icon: Clock, title: "وقت انتظار مجاني", text: "لحد 60 دقيقة بعد الهبوط الفعلي" },
  { icon: Headset, title: "دعم على مدار الساعة", text: "فريقنا موجود لأي طارئ" },
  { icon: Smartphone, title: "حجز سهل وسريع", text: "خطوتين بس وتذكرتك جاهزة" },
];

/** Dark operational-highlights strip below the ride-types section. */
export function ServiceHighlights() {
  return (
    <section className="bg-primary py-6">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 text-accent">
              <item.icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-primary-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs text-primary-foreground/70">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
