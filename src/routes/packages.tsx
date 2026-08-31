import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Crown, Luggage, Sparkles, Users } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { Button } from "@/components/ui/button";
import { fetchActivePackages, type PackageTier } from "@/lib/goair";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "الباقات — GoAir" },
      { name: "description", content: "باقات إضافية مصممة لراحتك فوق سعر المقعد الأساسي — من الراحة البسيطة لتجربة VIP كاملة." },
      { property: "og:title", content: "الباقات — GoAir" },
      { property: "og:description", content: "اختار الباقة اللي تناسب رحلتك." },
    ],
  }),
  component: PackagesPage,
});

const ICONS: Record<string, LucideIcon> = { Sparkles, Clock, Users, Crown };

function PackagesPage() {
  const { data: packages, isPending } = useQuery({ queryKey: ["goair", "packages"], queryFn: fetchActivePackages });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <SectionHeader
        title="الباقات"
        description="خدمات إضافية فوق سعر المقعد الأساسي — اختار الباقة اللي تناسب احتياجك في الرحلة."
      />

      {isPending ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">جاري تحميل الباقات...</p>
      ) : !packages || packages.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">مفيش باقات متاحة دلوقتي.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm text-muted-foreground">
        <Luggage className="size-4 shrink-0" />
        الباقات دي إضافية فوق سعر المقعد الأساسي، وبتتضاف لإجمالي حجزك تلقائيًا.
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageTier }) {
  const Icon = ICONS[pkg.iconName] ?? Sparkles;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-6 shadow-sm",
        pkg.isHighlighted
          ? "border-accent bg-primary text-primary-foreground shadow-lg ring-2 ring-accent"
          : "border-border bg-card text-card-foreground",
      )}
    >
      {pkg.isHighlighted ? (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          الأكثر طلبًا
        </span>
      ) : null}

      <span className={cn("flex size-11 items-center justify-center rounded-xl", pkg.isHighlighted ? "bg-primary-foreground/15" : "bg-secondary")}>
        <Icon className={cn("size-5", pkg.isHighlighted ? "text-accent" : "text-primary")} />
      </span>

      <h3 className="mt-4 font-display text-lg font-extrabold">{pkg.name}</h3>
      {pkg.tagline ? (
        <p className={cn("mt-1 text-sm", pkg.isHighlighted ? "text-primary-foreground/80" : "text-muted-foreground")}>{pkg.tagline}</p>
      ) : null}

      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-3xl font-extrabold">${pkg.priceUsd}</span>
        <span className={cn("text-sm", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>لكل مسافر</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", pkg.isHighlighted ? "text-accent" : "text-primary")} />
            <span className={pkg.isHighlighted ? "text-primary-foreground/90" : "text-foreground/90"}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Carries the chosen package all the way through search → book,
          where its price is added to the real total via create_booking_safe. */}
      <Button
        asChild
        className={cn("mt-6 w-full font-bold", pkg.isHighlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        <Link to="/" search={{ packageId: pkg.id }} hash="find-your-ride">
          اختار الباقة دي وابحث عن رحلتك
        </Link>
      </Button>
      <p className={cn("mt-2 text-center text-xs", pkg.isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
        الخطوة الجاية: اختار رحلتك، والباقة هتتضاف تلقائيًا
      </p>
    </div>
  );
}
