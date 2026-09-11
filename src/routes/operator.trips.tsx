import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useOperatorToken } from "@/lib/operator-session";
import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  formatOperatorMoney,
  getOperatorTrips,
  getOperatorTripPassengers,
  isOperatorAuthError,
  operatorSetTripStatus,
  OPERATOR_TRIP_STATUS_LABELS,
  type OperatorTrip,
} from "@/lib/operator";

const PASSENGER_STATUS_LABELS: Record<string, string> = {
  confirmed: "مؤكد",
  pending: "قيد التأكيد",
  completed: "تمت الرحلة",
};

export const Route = createFileRoute("/operator/trips")({
  head: () => ({ meta: [{ title: "الرحلات المخصصة — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: TripsPage,
});

function TripsPage() {
  const token = useOperatorToken();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["operator-trips", token], queryFn: () => getOperatorTrips(token), retry: false, enabled: Boolean(token) });
  const [activeTrip, setActiveTrip] = useState<OperatorTrip | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const trips = q.data ?? [];

  async function respondToTrip(assignmentId: string, status: "accepted" | "rejected") {
    setUpdatingId(assignmentId);
    try {
      await operatorSetTripStatus(token, assignmentId, status);
      await qc.invalidateQueries({ queryKey: ["operator-trips", token] });
      toast.success(status === "accepted" ? "تم قبول الرحلة." : "تم رفض الرحلة.");
    } catch {
      toast.error("حصل خطأ مؤقت. حاول تاني.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <OperatorSection title="الرحلات المخصصة لأسطولك">
      {trips.length === 0 ? (
        <p className="text-sm text-muted-foreground">مفيش رحلات متخصصة لعربياتك لسه.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الخط</TableHead>
                <TableHead className="text-right">العربية</TableHead>
                <TableHead className="text-right">السائق</TableHead>
                <TableHead className="text-right">المقاعد</TableHead>
                <TableHead className="text-right">المستحق</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الركاب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => (
                <TableRow key={t.assignmentId}>
                  <TableCell className="font-semibold text-primary">{t.travelDate}</TableCell>
                  <TableCell>{t.origin} ← {t.destination}</TableCell>
                  <TableCell>{t.vehiclePlate}</TableCell>
                  <TableCell>{t.driverName ?? "—"}</TableCell>
                  <TableCell>{t.seatsCount}</TableCell>
                  <TableCell className="font-bold text-accent">{formatOperatorMoney(t.amountDueUsd)}</TableCell>
                  <TableCell>
                    {t.operatorStatus === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 gap-1 px-2"
                          disabled={updatingId === t.assignmentId}
                          onClick={() => respondToTrip(t.assignmentId, "accepted")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-destructive"
                          disabled={updatingId === t.assignmentId}
                          onClick={() => respondToTrip(t.assignmentId, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          رفض
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={
                          t.operatorStatus === "accepted"
                            ? "text-xs font-bold text-emerald-600"
                            : "text-xs font-bold text-destructive"
                        }
                      >
                        {OPERATOR_TRIP_STATUS_LABELS[t.operatorStatus] ?? t.operatorStatus}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTrip(t)}>
                      <Users className="h-3.5 w-3.5" />
                      بيانات الركاب
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PassengerDialog trip={activeTrip} token={token} onClose={() => setActiveTrip(null)} />
    </OperatorSection>
  );
}

function PassengerDialog({ trip, token, onClose }: { trip: OperatorTrip | null; token: string; onClose: () => void }) {
  const pq = useQuery({
    queryKey: ["operator-trip-passengers", token, trip?.assignmentId],
    queryFn: () => getOperatorTripPassengers(token, trip!.assignmentId),
    enabled: Boolean(trip),
    retry: false,
  });

  return (
    <Dialog open={Boolean(trip)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>بيانات ركاب الرحلة</DialogTitle>
          <DialogDescription>
            {trip ? `${trip.origin} ← ${trip.destination} — ${trip.travelDate}` : ""}
          </DialogDescription>
        </DialogHeader>

        {pq.isPending ? (
          <p className="text-sm text-muted-foreground">جاري تحميل بيانات الركاب…</p>
        ) : pq.isError ? (
          <p className="text-sm text-destructive">مقدرناش نجيب بيانات الركاب دلوقتي.</p>
        ) : (pq.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش حجوزات مؤكدة على الرحلة دي.</p>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {(pq.data ?? []).map((p) => (
              <div key={p.bookingId} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{p.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {PASSENGER_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
                {p.passengerNames && (
                  <p className="mt-1 text-muted-foreground">الركاب: {p.passengerNames}</p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>الهاتف: {p.phoneNumber}</span>
                  <span>المقاعد: {p.seatsCount}</span>
                  <span>رقم الرحلة الجوية: {p.flightNumber ?? "—"}</span>
                  <span>الشنط: {p.luggageCount}</span>
                  <span className="col-span-2">نقطة اللقاء: {p.meetingPoint ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
