import { CheckCircle2, Loader2, TimerReset } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PrivateVehicle, VehicleHold } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type BookingVehiclePickerProps = {
  vehicles: PrivateVehicle[];
  loading: boolean;
  selectedVehicleId: string | null;
  hold: VehicleHold | null;
  holding: boolean;
  holdError: string | null;
  secondsLeft: number;
  onSelect: (vehicleId: string) => void;
  onCancelSelection: () => void;
  className?: string;
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Shown inside the confirm step, only for a private booking whose route
 * actually has real registered vehicles (`vehicles` non-empty). Picking one
 * calls `hold_private_vehicle` to lock it for a few minutes so two customers
 * can't both confirm the same car; the parent step disables the final
 * "Confirm" button until a hold exists, and passes `hold.holdId` through as
 * `vehicleHoldId` when creating the booking.
 */
export function BookingVehiclePicker({
  vehicles,
  loading,
  selectedVehicleId,
  hold,
  holding,
  holdError,
  secondsLeft,
  onSelect,
  onCancelSelection,
  className,
}: BookingVehiclePickerProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("booking.vehiclePicker.loading")}
      </div>
    );
  }

  if (vehicles.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-border/80 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-bold text-primary">
          {t("booking.vehiclePicker.title")}
        </p>
        {hold ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
            <TimerReset className="size-3.5" aria-hidden />
            {formatCountdown(secondsLeft)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("booking.vehiclePicker.subtitle")}</p>

      {holdError ? <p className="mt-2 text-xs font-bold text-destructive">{holdError}</p> : null}

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.vehicleId;
          const disabled = holding || (Boolean(hold) && !isSelected);
          return (
            <button
              key={vehicle.vehicleId}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(vehicle.vehicleId)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-start transition-colors",
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border/80 hover:border-border",
                disabled && !isSelected ? "cursor-not-allowed opacity-40" : "",
              )}
            >
              {vehicle.photos[0] ? (
                <img
                  src={vehicle.photos[0]}
                  alt=""
                  loading="lazy"
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-primary">
                    {vehicle.makeModel ?? vehicle.vehicleTypeLabelAr}
                    {vehicle.vehicleYear ? ` (${vehicle.vehicleYear})` : ""}
                  </p>
                  {isSelected ? (
                    <CheckCircle2 className="size-4 shrink-0 text-accent" aria-hidden />
                  ) : null}
                </div>
                {vehicle.color ? (
                  <p className="text-xs text-muted-foreground">{vehicle.color}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("booking.vehiclePicker.capacityAndLuggage", {
                    capacity: vehicle.capacity,
                    luggage: vehicle.maxLuggage ?? "—",
                  })}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {hold ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelSelection}
          className="mt-3 h-9 text-xs font-bold text-muted-foreground hover:text-primary"
        >
          {t("booking.vehiclePicker.pickAnother")}
        </Button>
      ) : null}
    </div>
  );
}
