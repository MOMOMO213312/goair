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
    <section className="bg-primary py-8">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-primary-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-primary-foreground/70">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
