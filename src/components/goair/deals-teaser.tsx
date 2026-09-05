import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { fetchActivePackages, formatUsd } from "@/lib/goair";

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
          {packages.slice(0, 4).map((pkg) => (
            <Link
              key={pkg.id}
              to="/packages"
              className="group flex flex-col rounded-2xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Sparkles className="size-4.5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold text-primary">{pkg.name}</h3>
              {pkg.tagline ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pkg.tagline}</p>
              ) : null}
              <p className="mt-3 font-display text-lg font-extrabold text-accent">
                +{formatUsd(pkg.priceUsd)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
