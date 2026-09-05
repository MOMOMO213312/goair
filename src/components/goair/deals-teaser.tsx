import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { fetchActivePackages, formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

const CARD_THEMES = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-background text-primary border border-border",
  "bg-mist text-primary",
] as const;

/** Homepage teaser for the real packages/add-ons page — not a separate promise. */
export function DealsTeaser() {
  const { data: packages } = useQuery({
    queryKey: ["goair", "packages"],
    queryFn: fetchActivePackages,
  });

  if (!packages || packages.length === 0) return null;

  return (
    <section className="bg-mist/60 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader title="عروض GoAir" description="باقات إضافية تقدر تضيفها لحجزك — بسعر ثابت." />
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            شوف كل الباقات
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.slice(0, 4).map((pkg, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length] ?? CARD_THEMES[0];
            const isTinted = !theme.includes("bg-background");
            return (
              <Link
                key={pkg.id}
                to="/packages"
                className={cn(
                  "group flex flex-col rounded-2xl p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
                  theme,
                )}
              >
                <Sparkles className="size-5" aria-hidden />
                <h3 className="mt-5 font-display text-base font-extrabold">{pkg.name}</h3>
                {pkg.tagline ? (
                  <p
                    className={cn(
                      "mt-1 text-sm leading-relaxed",
                      isTinted ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {pkg.tagline}
                  </p>
                ) : null}
                <p className="mt-4 font-display text-lg font-extrabold">
                  +{formatUsd(pkg.priceUsd)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
