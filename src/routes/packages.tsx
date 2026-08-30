import type { LucideIcon } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Clock,
  Crown,
  Luggage,
  Sparkles,
  Users,
} from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "الباقات — GoAir" },
      {
        name: "description",
        content: "باقات إضافية مصممة لراحتك فوق سعر المقعد الأساسي — من الراحة البسيطة لتجربة VIP كاملة.",
      },
      { property: "og:title", content: "الباقات — GoAir" },
      { property: "og:description", content: "اختار الباقة اللي تناسب رحلتك." },
    ],
  }),
  component: PackagesPage,
});

type PackageTier = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  icon: LucideIcon;
  highlight?: boolean;
  features: string[];
};

const PACKAGES: PackageTier[] = [
  {
    id: "essential",
    name: "باقة الراحة الأساسية",
    tagline: "لو عايز تسافر من غير أي قلق",
    price: 15,
    icon: Sparkles,
    features: [
      "تأكيد فوري للمقعد + رسالة تذكير قبل الرحلة بساعة",
      "حقيبة إضافية واحدة مجانًا",
      "تغيير الموعد مجانًا مرة واحدة قبل الرحلة بـ 6 ساعات",
      "دعم عبر واتساب على مدار الرحلة",
    ],
  },
  {
    id: "comfort",
    name: "باقة المقعد المميز",
    tagline: "أولوية واختيار مكانك في العربية",
    price: 25,
    icon: Clock,
    highlight: true,
    features: [
      "كل مميزات باقة الراحة الأساسية",
      "اختيار المقعد (شباك أو قدام) عند التوفر",
      "أولوية الصعود والنزول من الفان",
      "مسار أسرع في نقاط التجمع (Fast Pickup)",
    ],
  },
  {
    id: "family",
    name: "باقة العائلة",
    tagline: "لسفر مريح لكل أفراد الأسرة",
    price: 40,
    icon: Users,
    features: [
      "كل مميزات باقة المقعد المميز",
      "ضمان مقاعد متجاورة لأفراد العائلة (حتى 4 أشخاص)",
      "مقعد أطفال عند الطلب",
      "حقيبتين إضافيتين مجانًا",
    ],
  },
  {
    id: "vip",
    name: "باقة VIP الوصول",
    tagline: "استقبال شخصي واهتمام كامل باسمك",
    price: 50,
    icon: Crown,
    features: [
      "كل مميزات باقة العائلة",
      "استقبال شخصي باسمك عند نقطة التجمع أو صالة الوصول",
      "مندوب مخصص طول الرحلة لأي طارئ",
      "إلغاء أو تغيير مجاني حتى ساعتين قبل الميعاد",
      "أولوية مطلقة في الصعود والنزول",
    ],
  },
];

function PackagesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <SectionHeader
        title="الباقات"
        description="خدمات إضافية فوق سعر المقعد الأساسي — اختار الباقة اللي تناسب احتياجك في الرحلة."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PACKAGES.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <div
              key={pkg.id}
              className={cn(
                "flex flex-col rounded-2xl border p-6 shadow-sm",
                pkg.highlight
                  ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
                  : "border-border bg-card text-card-foreground",
              )}
            >
              {pkg.highlight ? (
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                  الأكثر طلبًا
                </span>
              ) : null}

              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl",
                  pkg.highlight ? "bg-primary-foreground/15" : "bg-secondary",
                )}
              >
                <Icon className={cn("size-5", pkg.highlight ? "text-accent" : "text-primary")} />
              </span>

              <h3 className="mt-4 font-display text-lg font-extrabold">{pkg.name}</h3>
              <p
                className={cn(
                  "mt-1 text-sm",
                  pkg.highlight ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {pkg.tagline}
              </p>

              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold">${pkg.price}</span>
                <span
                  className={cn(
                    "text-sm",
                    pkg.highlight ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  لكل مسافر
                </span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        pkg.highlight ? "text-accent" : "text-primary",
                      )}
                    />
                    <span className={pkg.highlight ? "text-primary-foreground/90" : "text-foreground/90"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-6 w-full font-bold",
                  pkg.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <Link to="/" hash="find-your-ride">
                  اختار الباقة دي
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm text-muted-foreground">
        <Luggage className="size-4 shrink-0" />
        الباقات دي إضافية فوق سعر المقعد الأساسي، وممكن تضيفها وانت بتحجز رحلتك.
      </div>
    </div>
  );
}
