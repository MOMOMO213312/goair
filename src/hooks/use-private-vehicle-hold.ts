import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchAvailablePrivateVehicles,
  holdPrivateVehicle,
  releaseVehicleHold,
  type PrivateVehicle,
  type VehicleHold,
} from "@/lib/goair";

/**
 * Drives the "pick a real vehicle" step of a private booking: lists the
 * vehicles actually free for this trip/date+time, lets the customer lock one
 * (`hold_private_vehicle`, 10-minute default), and counts the hold down so
 * the UI can warn before it expires. Entirely optional from the booking
 * flow's point of view — when `vehicles` comes back empty (no real vehicles
 * registered on this route yet), the caller just skips this step and books
 * the same way it always has, with manual admin assignment after the fact.
 */
export function usePrivateVehicleHold(params: {
  tripId: string | undefined;
  vehicleTypeId: string | undefined;
  travelDatetime: string | undefined;
  enabled: boolean;
}) {
  const { tripId, vehicleTypeId, travelDatetime, enabled } = params;
  const queryClient = useQueryClient();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hold, setHold] = useState<VehicleHold | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryKey = useMemo(
    () => ["goair", "private-vehicles", tripId, vehicleTypeId, travelDatetime] as const,
    [tripId, vehicleTypeId, travelDatetime],
  );
  const vehiclesQuery = useQuery({
    queryKey,
    queryFn: () => fetchAvailablePrivateVehicles(tripId!, vehicleTypeId!, travelDatetime!),
    enabled: enabled && Boolean(tripId && vehicleTypeId && travelDatetime),
    staleTime: 15_000,
  });

  // Visible countdown to the hold's expiry; releases the selection locally
  // and re-fetches the list once it hits zero (the DB has already let it go).
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!hold) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(
        0,
        Math.round((new Date(hold.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(diff);
      if (diff <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setHold(null);
        setSelectedVehicleId(null);
        setHoldError("الوقت خلص — العربية دي رجعت متاحة، اختار من تاني.");
        queryClient.invalidateQueries({ queryKey });
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hold, queryClient, queryKey]);

  async function selectVehicle(vehicleId: string) {
    if (!tripId || !vehicleTypeId || !travelDatetime) return;
    setHolding(true);
    setHoldError(null);
    try {
      const newHold = await holdPrivateVehicle({
        vehicleId,
        tripId,
        vehicleTypeId,
        travelDatetime,
      });
      setSelectedVehicleId(vehicleId);
      setHold(newHold);
    } catch (error) {
      setHoldError(
        error instanceof Error ? error.message : "العربية دي اتاخدت خلاص، اختار عربية تانية.",
      );
      queryClient.invalidateQueries({ queryKey });
    } finally {
      setHolding(false);
    }
  }

  async function cancelSelection() {
    const current = hold;
    setHold(null);
    setSelectedVehicleId(null);
    setHoldError(null);
    if (current) {
      try {
        await releaseVehicleHold(current.holdId);
      } catch {
        // Best-effort — the hold still expires on its own.
      }
      queryClient.invalidateQueries({ queryKey });
    }
  }

  return {
    vehicles: vehiclesQuery.data ?? [],
    vehiclesLoading: vehiclesQuery.isLoading,
    selectedVehicleId,
    hold,
    holding,
    holdError,
    secondsLeft,
    selectVehicle,
    cancelSelection,
  };
}

export type { PrivateVehicle };
