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
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import type { AddonService, AddonServiceCategory, GroundHandlingPublicService } from "@/lib/goair";
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

const ADDON_CATEGORY_ORDER: AddonServiceCategory[] = ["before_trip", "luggage", "airport", "destination"];

/**
 * Visual service card — image-led (photo up top, real Pexels photo where
 * available), not an icon-first row. Matches the "Fast Track / Meet &
 * Assist / Lounge" card treatment: [image] → icon+title → description →
 * price → add button, with a distinct selected state on both the image
 * (accent ring + check badge) and the card itself.
 */
function AddonButton({
  addon,
  isSelected,
  onToggle,
}: {
  addon: AddonService;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { t, language } = useTranslation();
  const addonName = localize(addon.name, addon.nameEn, language);
  const addonDescription = addon.description
    ? localize(addon.description, addon.descriptionEn, language)
    : null;
  const Icon = ADDON_ICONS[addon.iconName] ?? Sparkles;
  // Real photo priority: DB-cached / manually-set image_url → curated
  // hardcoded fallback for a couple of legacy items → live-resolved via
  // the resolve-stock-photo Edge Function (cached back to the DB after the
  // first search, so every service only ever triggers ONE real Pexels
  // search, ever) → plain icon tile if nothing is ever found.
  const photo =
    useStockPhoto("addon_services", addon.id, addon.imageUrl) ?? ADDON_PHOTOS[addon.iconName];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border text-start transition-colors",
        isSelected ? "border-accent bg-accent/5" : "border-border/80 hover:border-accent/40",
      )}
    >
      {/* Photo — real image when resolved, icon-on-tint tile while it loads
          or if none is ever found, so the card never looks broken. */}
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt=""
            className={cn(
              "size-full object-cover transition-transform duration-300",
              !isSelected && "group-hover:scale-105",
            )}
            loading="lazy"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-primary/40">
            <Icon className="size-8" aria-hidden />
          </span>
        )}

        {/* Icon badge, top start — keeps the service's identity readable
            even once the photo is a generic-looking stock shot. */}
        <span className="absolute inset-x-2 top-2 flex items-center justify-between">
          <span className="flex size-7 items-center justify-center rounded-lg bg-background/90 text-primary shadow-sm backdrop-blur">
            <Icon className="size-3.5" aria-hidden />
          </span>
          {isSelected ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Check className="size-4" aria-hidden />
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="truncate font-display text-sm font-bold text-primary">{addonName}</span>
        {addonDescription ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{addonDescription}</span>
        ) : null}

        <span className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-extrabold text-primary">+{formatUsd(addon.priceUsd)}</span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
              isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
            )}
          >
            {isSelected ? (
              <>
                <Check className="size-3.5" aria-hidden />
                {t("booking.addonsStep.added")}
              </>
            ) : (
              <>
                <Plus className="size-3.5" aria-hidden />
                {t("booking.addonsStep.add")}
              </>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * A specific named partner's service (from their own catalog) — same card
 * treatment as a generic add-on, plus the partner's name and a "sold out"
 * state once `remainingCapacity` hits 0 for the trip's date.
 */
function PartnerServiceButton({
  service,
  isSelected,
  onToggle,
}: {
  service: GroundHandlingPublicService;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const soldOut = service.remainingCapacity !== null && service.remainingCapacity <= 0 && !isSelected;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={soldOut}
      aria-pressed={isSelected}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border text-start transition-colors",
        soldOut
          ? "cursor-not-allowed border-border/60 opacity-60"
          : isSelected
            ? "border-accent bg-accent/5"
            : "border-border/80 hover:border-accent/40",
      )}
    >
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden bg-secondary">
        <span className="flex size-full items-center justify-center text-primary/40">
          <Sparkles className="size-8" aria-hidden />
        </span>
        <span className="absolute inset-x-2 top-2 flex items-center justify-between">
          <span className="rounded-lg bg-background/90 px-2 py-0.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur">
            {service.partnerName}
          </span>
          {isSelected ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Check className="size-4" aria-hidden />
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="truncate font-display text-sm font-bold text-primary">{service.name}</span>
        {service.description ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{service.description}</span>
        ) : null}
        {service.terminal || service.direction ? (
          <span className="text-[11px] text-muted-foreground">
            {[service.terminal, service.direction].filter(Boolean).join(" · ")}
          </span>
        ) : null}

        <span className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-extrabold text-primary">+{formatUsd(service.priceUsd)}</span>
          {soldOut ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {t("booking.addonsStep.soldOut")}
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
              )}
            >
              {isSelected ? (
                <>
                  <Check className="size-3.5" aria-hidden />
                  {t("booking.addonsStep.added")}
                </>
              ) : (
                <>
                  <Plus className="size-3.5" aria-hidden />
                  {t("booking.addonsStep.add")}
                </>
              )}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

type BookingAddonsStepProps = {
  addons: AddonService[];
  addonsLoading: boolean;
  selectedAddonIds: string[];
  onToggleAddon: (id: string) => void;
  /** Specific partner services for this trip's airport — shown instead of the generic "airport" category when the airport has any approved. */
  groundHandlingServices?: GroundHandlingPublicService[];
  selectedGroundHandlingServiceIds?: string[];
  onToggleGroundHandlingService?: (id: string) => void;
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
  groundHandlingServices = [],
  selectedGroundHandlingServiceIds = [],
  onToggleGroundHandlingService,
  className,
}: BookingAddonsStepProps) {
  const { t } = useTranslation();
  const ADDON_CATEGORY_LABEL: Record<AddonServiceCategory, string> = {
    before_trip: t("booking.addonsStep.categories.before_trip"),
    luggage: t("booking.addonsStep.categories.luggage"),
    airport: t("booking.addonsStep.categories.airport"),
    destination: t("booking.addonsStep.categories.destination"),
  };

  // The trip's airport has an approved partner catalog — show named
  // partner services for "airport" instead of the generic ones (falls
  // back to generic automatically wherever the partner catalog is empty).
  const hasPartnerCatalog = groundHandlingServices.length > 0;

  if (!addonsLoading && addons.length === 0 && !hasPartnerCatalog) return null;

  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{t("booking.addonsStep.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("booking.addonsStep.subtitle")}</p>

      {addonsLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-xl bg-secondary/50" />
          <div className="h-48 animate-pulse rounded-xl bg-secondary/50" />
          <div className="hidden h-48 animate-pulse rounded-xl bg-secondary/50 lg:block" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {ADDON_CATEGORY_ORDER.map((category) => {
            if (category === "airport" && hasPartnerCatalog) {
              return (
                <div key={category}>
                  <h3 className="text-xs font-bold text-muted-foreground">{ADDON_CATEGORY_LABEL[category]}</h3>
                  <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groundHandlingServices.map((service) => (
                      <PartnerServiceButton
                        key={service.id}
                        service={service}
                        isSelected={selectedGroundHandlingServiceIds.includes(service.id)}
                        onToggle={() => onToggleGroundHandlingService?.(service.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            const items = addons.filter((a) => a.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-xs font-bold text-muted-foreground">{ADDON_CATEGORY_LABEL[category]}</h3>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
