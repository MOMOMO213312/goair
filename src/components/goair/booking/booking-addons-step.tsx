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
import { useStockPhoto } from "@/hooks/use-stock-photo";
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

/**
 * Real, freely-licensed photos (Pexels — see licensing note in the image
 * library) for the handful of airport add-ons where a generic real photo
 * reads better than an icon. Keyed by `icon_name` (stable, DB-assigned)
 * rather than the Arabic label, which can be edited from the admin panel.
 * Anything not listed here keeps its icon — no photo yet for the rest.
 */
const ADDON_PHOTOS: Partial<Record<string, string>> = {
  // Fast Track — travelers at a security checkpoint.
  Zap: "https://images.pexels.com/photos/37847918/pexels-photo-37847918.jpeg?auto=compress&cs=tinysrgb&w=400",
  // دخول صالة كبار الشخصيات — modern airport lounge.
  Armchair:
    "https://images.pexels.com/photos/31773252/pexels-photo-31773252.jpeg?auto=compress&cs=tinysrgb&w=400",
  // خدمة حمال — traveler with luggage at the terminal.
  PackageOpen:
    "https://images.pexels.com/photos/32176403/pexels-photo-32176403.jpeg?auto=compress&cs=tinysrgb&w=400",
};

const ADDON_CATEGORY_LABEL: Record<AddonServiceCategory, string> = {
  before_trip: "قبل الرحلة",
  luggage: "الأمتعة",
  airport: "في المطار",
  destination: "خدمات الوجهة",
};

const ADDON_CATEGORY_ORDER: AddonServiceCategory[] = ["before_trip", "luggage", "airport", "destination"];

function AddonButton({
  addon,
  isSelected,
  onToggle,
}: {
  addon: AddonService;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const Icon = ADDON_ICONS[addon.iconName] ?? Sparkles;
  // Real photo priority: DB-cached / manually-set image_url → curated
  // hardcoded fallback for a couple of legacy items → live-resolved via
  // the resolve-stock-photo Edge Function (cached back to the DB after the
  // first search) → plain icon if nothing is ever found.
  const photo =
    useStockPhoto("addon_services", addon.id, addon.imageUrl) ?? ADDON_PHOTOS[addon.iconName];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 text-start transition-colors",
        isSelected ? "border-accent bg-accent/5" : "border-border/80 hover:border-accent/40",
      )}
    >
      {photo ? (
        <span className="size-10 shrink-0 overflow-hidden rounded-lg">
          <img src={photo} alt="" className="size-full object-cover" loading="lazy" />
        </span>
      ) : (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            isSelected ? "bg-accent/20 text-accent" : "bg-secondary text-primary",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold text-primary">{addon.name}</p>
        {addon.description ? (
          <p className="truncate text-xs text-muted-foreground">{addon.description}</p>
        ) : null}
      </div>

      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
          isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
        )}
      >
        {isSelected ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
        {isSelected ? "متضاف" : `+${formatUsd(addon.priceUsd)}`}
      </span>
    </button>
  );
}

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
                  {items.map((addon) => (
                    <AddonButton
                      key={addon.id}
                      addon={addon}
                      isSelected={selectedAddonIds.includes(addon.id)}
                      onToggle={() => onToggleAddon(addon.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
