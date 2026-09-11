import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GHLoading, GHEmpty, GHAuthError } from "@/components/ground-handling/ground-handling-shell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getGroundHandlingFlights,
  getGroundHandlingFlightDetail,
  groundHandlingStatusLabel,
  formatGroundHandlingDateTime,
  isGroundHandlingAuthError,
  type GroundHandlingFlight,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/flights")({
  head: () => ({ meta: [{ title: "الرحلات — بوابة GOAIR للخدمات الأرضية" }] }),
  component: FlightsPage,
});

function FlightsPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const [activeFlight, setActiveFlight] = useState<GroundHandlingFlight | null>(null);

  const flightsQuery = useQuery({
    queryKey: ["ground-handling-flights", token],
    queryFn: () => getGroundHandlingFlights(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (flightsQuery.isPending) return <GHLoading />;
  if (flightsQuery.isError) {
    if (isGroundHandlingAuthError(flightsQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const flights = flightsQuery.data ?? [];

  return (
    <div className="space-y-3">
      {flights.length === 0 ? (
        <GHEmpty>مفيش رحلات مرتبطة بطلبات خدمات حاليًا.</GHEmpty>
      ) : (
        flights.map((f) => (
          <Card
            key={f.bookingId}
            className={`cursor-pointer rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] hover:bg-muted ${f.urgentCount > 0 ? "border-destructive/50" : ""}`}
            onClick={() => setActiveFlight(f)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-base font-bold text-primary">
                  {f.flightNumber ?? "بدون رقم رحلة"}
                  {f.urgentCount > 0 ? <span className="mr-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">{f.urgentCount} عاجل</span> : null}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {f.origin} ← {f.destination} · {formatGroundHandlingDateTime(f.travelDatetime ?? f.travelDate)}
                </p>
              </div>
              <div className="text-left text-sm text-muted-foreground">
                <p>{f.passengerCount} مسافر</p>
                <p>{f.servicesCount} خدمة</p>
              </div>
            </div>
          </Card>
        ))
      )}

      <Dialog open={Boolean(activeFlight)} onOpenChange={(open) => !open && setActiveFlight(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeFlight?.flightNumber ?? "تفاصيل الرحلة"}</DialogTitle>
          </DialogHeader>
          {activeFlight ? <FlightDetail token={token} bookingId={activeFlight.bookingId} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlightDetail({ token, bookingId }: { token: string; bookingId: string }) {
  const detailQuery = useQuery({
    queryKey: ["ground-handling-flight-detail", token, bookingId],
    queryFn: () => getGroundHandlingFlightDetail(token, bookingId),
    retry: false,
  });

  if (detailQuery.isPending) return <GHLoading />;
  const rows = detailQuery.data ?? [];
  if (rows.length === 0) return <GHEmpty>مفيش تفاصيل لهذه الرحلة.</GHEmpty>;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.requestId} className="rounded-lg border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-primary">{r.serviceName}</p>
            <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-bold text-primary">
              {groundHandlingStatusLabel(r.status)}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {r.passengerName} — {r.phoneNumber}
          </p>
          {r.terminal || r.direction ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {r.terminal ?? ""} {r.direction ? (r.direction === "arrival" ? "وصول" : "مغادرة") : ""}
            </p>
          ) : null}
          {r.assignedStaffName ? <p className="mt-0.5 text-xs font-bold text-primary">الموظف: {r.assignedStaffName}</p> : null}
        </div>
      ))}
    </div>
  );
}
