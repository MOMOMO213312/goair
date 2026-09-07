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
  Hotel,
  KeyRound,
  Luggage,
  MapPinned,
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
  Hotel,
  MapPinned,
  Weight,
  Gift,
};

const ADDON_CATEGORY_LABEL: Record<AddonServiceCategory, string> = {
  before_trip: "قبل الرحلة",
  luggage: "الأمتعة",
  airport: "في المطار",
  destination: "خدمات الوجهة",
};

const ADDON_CATEGORY_ORDER: AddonServiceCategory[] = ["before_trip", "luggage", "airport", "destination"];

type BookingAddonsStepProps = {
  addons: AddonService[];
  addonsLoading: boolean;
  selectedAddonIds: string[];
  onToggleAddon: (id: string) => void;
  className?: string;
};

/**
 * "Make your airport experience easier" — individual add-on services shown
 * as compact toggle cards (not a step navigation, not checkboxes). Flat
 * price per service, unrelated to seat count — matches how
 * `create_booking_safe` sums `addon_services.price_usd` server-side.
 */
export function BookingAddonsStep({
  addons,
  addonsLoading,
  selectedAddonIds,
  onToggleAddon,
  className,
}: BookingAddonsStepProps) {
  if (!addonsLoading && addons.length === 0) return null;

  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">سهّل رحلتك من المطار</h2>
      <p className="mt-1 text-sm text-muted-foreground">اختياري — ضيف أي خدمة تحسّن تجربتك.</p>

      {addonsLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl bg-secondary/50" />
          <div className="h-20 animate-pulse rounded-xl bg-secondary/50" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {ADDON_CATEGORY_ORDER.map((category) => {
            const items = addons.filter((a) => a.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-xs font-bold text-muted-foreground">{ADDON_CATEGORY_LABEL[category]}</h3>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  {items.map((addon) => {
                    const Icon = ADDON_ICONS[addon.iconName] ?? Sparkles;
                    const isSelected = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => onToggleAddon(addon.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3.5 text-start transition-colors",
                          isSelected ? "border-accent bg-accent/5" : "border-border/80 hover:border-accent/40",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            isSelected ? "bg-accent/20 text-accent" : "bg-secondary text-primary",
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-primary">{addon.name}</p>
                          {addon.description ? (
                            <p className="truncate text-xs text-muted-foreground">{addon.description}</p>
                          ) : null}
                        </div>

                        <span
                          className={cn(
                            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-primary",
                          )}
                        >
                          {isSelected ? (
                            <Check className="size-3.5" aria-hidden />
                          ) : (
                            <Plus className="size-3.5" aria-hidden />
                          )}
                          {isSelected ? "متضاف" : `+${formatUsd(addon.priceUsd)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
