import { CheckCircle2, Headphones, MapPin, Wallet } from "lucide-react";

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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
            ليه GoAir؟
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
            منصة نقل مطاري مصممة تكون واضحة وسريعة وموثوقة — من أول لحظة بحث لحد ما تشوف اللافتة بإسمك.
          </p>
        </div>

        <div className="divide-y divide-border/70">
          {benefits.map((item) => (
            <div key={item.title} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
              <item.icon className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="font-display text-base font-bold text-primary">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
