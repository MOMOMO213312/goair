import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GHLoading, GHEmpty, GHAuthError } from "@/components/ground-handling/ground-handling-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getGroundHandlingTravelers,
  getGroundHandlingTravelerHistory,
  groundHandlingStatusLabel,
  formatGroundHandlingDate,
  isGroundHandlingAuthError,
  type GroundHandlingTraveler,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/travelers")({
  head: () => ({ meta: [{ title: "المسافرون — بوابة GOAIR للخدمات الأرضية" }] }),
  component: TravelersPage,
});

function TravelersPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const [active, setActive] = useState<GroundHandlingTraveler | null>(null);

  const travelersQuery = useQuery({
    queryKey: ["ground-handling-travelers", token],
    queryFn: () => getGroundHandlingTravelers(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (travelersQuery.isPending) return <GHLoading />;
  if (travelersQuery.isError) {
    if (isGroundHandlingAuthError(travelersQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const travelers = travelersQuery.data ?? [];

  return (
    <div className="space-y-3">
      {travelers.length === 0 ? (
        <GHEmpty>مفيش مسافرين مرتبطين بطلبات حاليًا.</GHEmpty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المسافر</TableHead>
                <TableHead className="text-right">رقم الرحلة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">عدد الطلبات</TableHead>
                <TableHead className="text-right">المكتملة</TableHead>
                <TableHead className="text-right">إجمالي الإنفاق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {travelers.map((t) => (
                <TableRow key={t.bookingId} className="cursor-pointer hover:bg-muted" onClick={() => setActive(t)}>
                  <TableCell className="font-bold text-primary">{t.passengerName}</TableCell>
                  <TableCell>{t.flightNumber ?? "—"}</TableCell>
                  <TableCell>{formatGroundHandlingDate(t.travelDate)}</TableCell>
                  <TableCell>{t.requestsCount}</TableCell>
                  <TableCell>{t.completedCount}</TableCell>
                  <TableCell>${t.totalSpentUsd.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.passengerName}</DialogTitle>
          </DialogHeader>
          {active ? <TravelerHistory token={token} bookingId={active.bookingId} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TravelerHistory({ token, bookingId }: { token: string; bookingId: string }) {
  const historyQuery = useQuery({
    queryKey: ["ground-handling-traveler-history", token, bookingId],
    queryFn: () => getGroundHandlingTravelerHistory(token, bookingId),
    retry: false,
  });

  if (historyQuery.isPending) return <GHLoading />;
  const rows = historyQuery.data ?? [];
  if (rows.length === 0) return <GHEmpty>مفيش سجل خدمات لهذا المسافر.</GHEmpty>;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.requestId} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="font-bold text-primary">{r.serviceName}</p>
            <p className="text-xs text-muted-foreground">{formatGroundHandlingDate(r.travelDate)} · ${r.priceUsd.toFixed(2)}</p>
          </div>
          <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-bold text-primary">
            {groundHandlingStatusLabel(r.status)}
          </span>
        </div>
      ))}
    </div>
  );
}
