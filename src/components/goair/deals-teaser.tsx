import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Award, Clock, Crown, Gem, Sparkles, UserRound } from "lucide-react";

import { SectionHeader } from "@/components/goair/section-header";
import { useStockPhoto } from "@/hooks/use-stock-photo";
import { fetchActivePackages, formatUsd, type PackageTier } from "@/lib/goair";

const ICONS: Record<string, LucideIcon> = { Sparkles, Clock, UserRound, Crown, Award, Gem };

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
            to="/explore"
            search={{ tab: "packages" }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            شوف كل الباقات
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.slice(0, 4).map((pkg) => (
            <DealsTeaserCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealsTeaserCard({ pkg }: { pkg: PackageTier }) {
  const Icon = ICONS[pkg.iconName] ?? Sparkles;
  const photo = useStockPhoto("packages", pkg.id, pkg.imageUrl);

  return (
    <Link
      to="/explore"
      search={{ tab: "packages" }}
      className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-primary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

      <span className="relative m-4 flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
        <Icon className="size-4.5 text-white" aria-hidden />
      </span>

      <div className="relative mt-auto p-4">
        <h3 className="font-display text-base font-extrabold text-white">{pkg.name}</h3>
        {pkg.tagline ? (
          <p className="mt-1 text-sm leading-relaxed text-white/80">{pkg.tagline}</p>
        ) : null}
        <p className="mt-3 font-display text-lg font-extrabold text-white">+{formatUsd(pkg.priceUsd)}</p>
      </div>
    </Link>
  );
}
