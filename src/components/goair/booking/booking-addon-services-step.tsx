import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Armchair,
  Baby,
  CalendarClock,
  Car,
  Check,
  Dumbbell,
  Gift,
  KeyRound,
  Luggage,
  PackageOpen,
  ParkingCircle,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UserRound,
  Users,
  Weight,
  Wifi,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AddonService, AddonServiceCategory } from "@/lib/goair";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

const ADDON_ICONS: Record<string, LucideIcon> = {
  Zap,
  ShieldCheck,
  CalendarClock,
  Luggage,
  Baby,
  Dumbbell,
  UserRound,
  Armchair,
  PackageOpen,
  Wifi,
  Smartphone,
  Sparkles,
  Car,
  ParkingCircle,
  KeyRound,
  Users,
  Accessibility,
  ShoppingBag,
  Gift,
  Weight,
};

const CATEGORY_LABEL: Record<AddonServiceCategory, string> = {
  before_trip: "قبل الرحلة",
  luggage: "الأمتعة",
  airport: "في المطار",
  destination: "خدمات الوجهة",
};

/**
 * Simple recommendation engine (passenger direction → which service
 * categories matter most): a traveler heading TO the airport cares about
 * check-in/priority + Fast Track + luggage; a traveler arriving FROM the
 * airport cares about Meet & Assist / porter + luggage + destination
 * connectivity. Both always see every category — this only reorders so the
 * relevant ones lead — nothing is hidden.
 */
function categoryOrderFor(direction: "to_airport" | "from_airport"): AddonServiceCategory[] {
  return direction === "from_airport"
    ? ["airport", "luggage", "destination", "before_trip"]
    : ["before_trip", "airport", "luggage", "destination"];
}

type BookingAddonServicesStepProps = {
  addons: AddonService[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Which leg this booking covers — drives the recommendation ordering above. */
  direction?: "to_airport" | "from_airport";
  className?: string;
};

export function BookingAddonServicesStep({
  addons,
  loading,
  selectedIds,
  onToggle,
  direction = "to_airport",
  className,
}: BookingAddonServicesStepProps) {
  if (loading) {
    return (
      <div className={cn("mt-6 space-y-3", className)}>
        <div className="h-16 animate-pulse rounded-xl bg-secondary/50" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary/50" />
      </div>
    );
  }

  if (addons.length === 0) return null;

  const order = categoryOrderFor(direction);

  return (
    <div className={cn("mt-6", className)}>
      <h3 className="font-display text-sm font-extrabold text-primary">
        {direction === "from_airport" ? "جهّز استقبالك من المطار" : "جهّز رحلتك للمطار"}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        اختياري — ضيف أي خدمة براحتك، والسعر بيتحدث لحظيًا في الملخص.
      </p>

      <div className="mt-4 space-y-5">
        {order.map((category) => {
          const items = addons.filter((addon) => addon.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[category]}
              </p>
              <div className="mt-2 flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {items.map((addon) => {
                  const Icon = ADDON_ICONS[addon.iconName] ?? Sparkles;
                  const isSelected = selectedIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => onToggle(addon.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex w-[168px] shrink-0 flex-col gap-2 rounded-xl border p-3 text-start transition-colors sm:w-[176px]",
                        isSelected
                          ? "border-accent bg-accent/5"
                          : "border-border/80 hover:border-accent/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg",
                            isSelected ? "bg-accent/15 text-accent" : "bg-secondary text-primary",
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        {addon.isHighlighted ? (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-accent">
                            مطلوبة
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p className="font-display text-xs font-bold leading-tight text-primary">
                          {addon.name}
                        </p>
                        {addon.description ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                            {addon.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <span className="font-display text-xs font-extrabold text-accent">
                          +{formatUsd(addon.priceUsd)}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-primary",
                          )}
                        >
                          {isSelected ? (
                            <>
                              <Check className="size-3" aria-hidden />
                              تمت الإضافة
                            </>
                          ) : (
                            <>
                              <Plus className="size-3" aria-hidden />
                              إضافة
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Card wrapper matching BookingExtrasStep's shell, for use as a standalone step. */
export function BookingAddonServicesCard(props: BookingAddonServicesStepProps) {
  return (
    <Card className="border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <BookingAddonServicesStep {...props} className="mt-0" />
    </Card>
  );
}
