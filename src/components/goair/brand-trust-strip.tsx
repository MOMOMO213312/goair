import { MapPinned, ShieldCheck, Users2 } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "آمن وموثوق", text: "سلامتك أولويتنا في كل رحلة" },
  { icon: Users2, title: "يثق بنا الآلاف", text: "من الركاب والشركاء" },
  { icon: MapPinned, title: "تغطية واسعة", text: "أهم المدن والمطارات في مصر ولبنان" },
];

/** Closing brand-trust band, just above the footer. */
export function BrandTrustStrip() {
  return (
    <section className="border-t border-border bg-mist/40 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <item.icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-primary">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
