import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Backpack,
  Bell,
  Building2,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { PartnerSection, PartnerTempError } from "@/components/partner/partner-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActivePackages,
  fetchAddonServices,
  formatUsd,
  type AddonService,
  type AddonServiceCategory,
  type PackageTier,
} from "@/lib/goair";

export const Route = createFileRoute("/partner/services")({
  head: () => ({
    meta: [
      { title: "خدماتك — بوابة الشركاء GoAir" },
      {
        name: "description",
        content: "كل الباقات والخدمات الإضافية اللي تقدر تبيعها لمسافريك عبر GoAir.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerServicesPage,
});

const CATEGORY_META: Record<AddonServiceCategory, { label: string; icon: LucideIcon }> = {
  before_trip: { label: "قبل الرحلة", icon: Bell },
  luggage: { label: "الأمتعة", icon: Backpack },
  airport: { label: "خدمات المطار", icon: Building2 },
  destination: { label: "في الوجهة", icon: MapPin },
};

function groupByCategory(services: AddonService[]) {
  const groups = new Map<AddonServiceCategory, AddonService[]>();
  for (const service of services) {
    const list = groups.get(service.category) ?? [];
    list.push(service);
    groups.set(service.category, list);
  }
  return groups;
}

function PartnerServicesPage() {
  const packagesQuery = useQuery({
    queryKey: ["partner-services", "packages"],
    queryFn: fetchActivePackages,
    retry: false,
  });
  const addonsQuery = useQuery({
    queryKey: ["partner-services", "addons"],
    queryFn: fetchAddonServices,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PartnerSection
        title="خدماتك"
        description="كل الباقات والخدمات الإضافية اللي تقدر تعرضها على مسافريك."
      >
        <p className="text-sm text-muted-foreground">
          كل حجز بتعمله من{" "}
          <Link to="/partner/book" className="font-bold text-primary underline underline-offset-2">
            احجز لعميل
          </Link>{" "}
          تقدر تضيف عليه أي باقة أو خدمة من دول، وتتحسب أوتوماتيك ضمن قيمة الحجز وعمولتك.
        </p>
      </PartnerSection>

      <PartnerSection title="الباقات الجاهزة" description="باقات شاملة بسعر واحد ثابت لكل راكب.">
        {packagesQuery.isPending ? (
          <PackagesSkeleton />
        ) : packagesQuery.isError ? (
          <PartnerTempError />
        ) : (packagesQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش باقات متاحة حاليًا.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(packagesQuery.data ?? []).map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </PartnerSection>

      <PartnerSection
        title="الخدمات الإضافية"
        description="خدمات منفردة تقدر تضيفها لأي حجز حسب احتياج الراكب."
      >
        {addonsQuery.isPending ? (
          <PackagesSkeleton />
        ) : addonsQuery.isError ? (
          <PartnerTempError />
        ) : (addonsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش خدمات إضافية متاحة حاليًا.</p>
        ) : (
          <div className="space-y-6">
            {Array.from(groupByCategory(addonsQuery.data ?? [])).map(([category, services]) => (
              <AddonCategoryGroup key={category} category={category} services={services} />
            ))}
          </div>
        )}
      </PartnerSection>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageTier }) {
  return (
    <Card
      className={
        "flex flex-col rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] " +
        (pkg.isHighlighted ? "border-accent/40 bg-accent/5" : "")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-extrabold text-primary">{pkg.name}</h3>
          {pkg.tagline ? <p className="mt-1 text-xs text-muted-foreground">{pkg.tagline}</p> : null}
        </div>
        {pkg.isHighlighted ? (
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
            الأكثر طلبًا
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-primary">
        {formatUsd(pkg.priceUsd)}
        <span className="text-xs font-medium text-muted-foreground"> / للراكب</span>
      </p>
      {pkg.features.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function AddonCategoryGroup({
  category,
  services,
}: {
  category: AddonServiceCategory;
  services: AddonService[];
}) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: Sparkles };
  const Icon = meta.icon;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="font-display text-sm font-extrabold text-primary">{meta.label}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card
            key={service.id}
            className="flex items-start justify-between gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]"
          >
            <div className="min-w-0">
              <p className="font-bold text-primary">{service.name}</p>
              {service.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
              ) : null}
            </div>
            <span className="shrink-0 font-display text-sm font-extrabold text-primary">
              {formatUsd(service.priceUsd)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PackagesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} className="rounded-xl p-5 shadow-[var(--shadow-card)]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-4 h-16 w-full" />
        </Card>
      ))}
    </div>
  );
}
