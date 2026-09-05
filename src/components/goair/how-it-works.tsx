import { CalendarSearch, MousePointerClick, Ticket, UserRound } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";

const STEPS = [
  {
    icon: CalendarSearch,
    title: "ابحث",
    text: "اختار المطار والوجهة والتاريخ، وشوف كل المواعيد والأسعار المتاحة.",
  },
  {
    icon: MousePointerClick,
    title: "اختار",
    text: "قارن بين المواعيد، وحدد نقل مشترك أو خاص حسب مجموعتك.",
  },
  {
    icon: Ticket,
    title: "احجز",
    text: "أدخل بيانات المسافرين وأكّد الدفع — تذكرتك جاهزة فورًا.",
  },
  {
    icon: UserRound,
    title: "استقبال",
    text: "مندوب GoAir مستنيك في صالة الوصول بلافتة عليها اسمك.",
  },
] as const;

/** Simple 4-step "how it works" strip — sits right after the core homepage sections. */
export function HowItWorks() {
  return (
    <section className="bg-mist/60 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader title="إزاي تحجز مع GoAir" description="من البحث للاستقبال في 4 خطوات بسيطة." />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-start">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <step.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-xs font-bold text-accent">الخطوة {index + 1}</p>
              <h3 className="mt-1 font-display text-lg font-extrabold text-primary">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
