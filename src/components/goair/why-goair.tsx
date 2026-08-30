import { CheckCircle2, Headphones, MapPin, Wallet } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Card } from "@/components/ui/card";

const benefits = [
  {
    icon: Wallet,
    title: "أسعار واضحة",
    text: "السعر المعروض لكل مقعد هو ما سيتم احتسابه — بدون مفاجآت عند الدفع.",
  },
  {
    icon: CheckCircle2,
    title: "حجز سهل",
    text: "ابحث عن خطك، اختر الموعد، وأكمل بياناتك في خطوات بسيطة.",
  },
  {
    icon: MapPin,
    title: "خدمة من وإلى المطار",
    text: "نقل مشترك يربط المطارات بالمدن والوجهات التي نغطيها في مصر ولبنان.",
  },
  {
    icon: Headphones,
    title: "دعم عند الحاجة",
    text: "فريق GoAir متاح للرد على استفساراتك حول الحجز والمواعيد.",
  },
];

export function WhyGoAir() {
  return (
    <section className="bg-mist py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title="لماذا GoAir؟"
          description="منصة نقل مطاري مصممة لتكون واضحة وسريعة وموثوقة."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <Card
              key={item.title}
              className="border-border/80 bg-background p-5 shadow-[var(--shadow-card)]"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
