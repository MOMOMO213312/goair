import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Repeat, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useOperatorToken } from "@/lib/operator-session";
import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatOperatorMoney,
  getOperatorFleet,
  getOperatorTrips,
  getOperatorTripPassengers,
  isOperatorAuthError,
  operatorReassignTrip,
  operatorSetTripStatus,
  OPERATOR_TRIP_STATUS_LABELS,
  OPERATOR_STATUS_TRANSITIONS,
  OPERATOR_STATUSES_REQUIRING_NOTE,
  OPERATOR_TERMINAL_STATUSES,
  type OperatorDriver,
  type OperatorTrip,
  type OperatorTripStatus,
  type OperatorVehicle,
} from "@/lib/operator";

const STATUS_BADGE_CLASS: Record<string, string> = {
  accepted: "text-emerald-600",
  on_the_way: "text-blue-600",
  picked_up: "text-blue-700",
  completed: "text-emerald-700",
  rejected: "text-destructive",
  cancelled: "text-destructive",
  no_show: "text-destructive",
  delayed: "text-amber-600",
  vehicle_issue: "text-amber-700",
  driver_change: "text-amber-700",
};

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
  const [statusTrip, setStatusTrip] = useState<OperatorTrip | null>(null);
  const [reassignTrip, setReassignTrip] = useState<OperatorTrip | null>(null);
  const fleetQ = useQuery({
    queryKey: ["operator-fleet-lite", token],
    queryFn: () => getOperatorFleet(token),
    enabled: Boolean(token) && Boolean(reassignTrip),
    retry: false,
  });
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const trips = q.data ?? [];

  async function respondPending(assignmentId: string, status: "accepted" | "rejected") {
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

  async function submitStatusChange(assignmentId: string, status: OperatorTripStatus, note: string) {
    setUpdatingId(assignmentId);
    try {
      await operatorSetTripStatus(token, assignmentId, status, note);
      await qc.invalidateQueries({ queryKey: ["operator-trips", token] });
      toast.success("تم تحديث حالة الرحلة.");
      setStatusTrip(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ مؤقت. حاول تاني.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function submitReassign(
    assignmentId: string,
    updates: { vehicleId?: string; driverId?: string },
  ) {
    setUpdatingId(assignmentId);
    try {
      await operatorReassignTrip(token, assignmentId, updates);
      await qc.invalidateQueries({ queryKey: ["operator-trips", token] });
      toast.success("تم تعديل الرحلة.");
      setReassignTrip(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ مؤقت. حاول تاني.");
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
                          onClick={() => respondPending(t.assignmentId, "accepted")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-destructive"
                          disabled={updatingId === t.assignmentId}
                          onClick={() => respondPending(t.assignmentId, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          رفض
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${STATUS_BADGE_CLASS[t.operatorStatus] ?? "text-muted-foreground"}`}>
                          {OPERATOR_TRIP_STATUS_LABELS[t.operatorStatus] ?? t.operatorStatus}
                        </span>
                        {t.statusNote ? (
                          <span className="text-xs text-muted-foreground">{t.statusNote}</span>
                        ) : null}
                        {!OPERATOR_TERMINAL_STATUSES.has(t.operatorStatus) ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 gap-1 px-2 text-xs"
                              onClick={() => setStatusTrip(t)}
                            >
                              <Clock className="h-3 w-3" />
                              تحديث الحالة
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 gap-1 px-2 text-xs"
                              onClick={() => setReassignTrip(t)}
                            >
                              <Repeat className="h-3 w-3" />
                              تغيير السواق/العربية
                            </Button>
                          </div>
                        ) : null}
                      </div>
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
      <StatusUpdateDialog
        trip={statusTrip}
        updating={updatingId === statusTrip?.assignmentId}
        onClose={() => setStatusTrip(null)}
        onSubmit={submitStatusChange}
      />
      <ReassignDialog
        trip={reassignTrip}
        drivers={fleetQ.data?.drivers ?? []}
        vehicles={fleetQ.data?.vehicles ?? []}
        loadingFleet={fleetQ.isPending}
        updating={updatingId === reassignTrip?.assignmentId}
        onClose={() => setReassignTrip(null)}
        onSubmit={submitReassign}
      />
    </OperatorSection>
  );
}

function StatusUpdateDialog({
  trip,
  updating,
  onClose,
  onSubmit,
}: {
  trip: OperatorTrip | null;
  updating: boolean;
  onClose: () => void;
  onSubmit: (assignmentId: string, status: OperatorTripStatus, note: string) => void;
}) {
  const [selected, setSelected] = useState<OperatorTripStatus | null>(null);
  const [note, setNote] = useState("");

  const options = trip ? OPERATOR_STATUS_TRANSITIONS[trip.operatorStatus] ?? [] : [];
  const needsNote = selected ? OPERATOR_STATUSES_REQUIRING_NOTE.has(selected) : false;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelected(null);
      setNote("");
      onClose();
    }
  }

  function submit() {
    if (!trip || !selected) return;
    if (needsNote && !note.trim()) return;
    onSubmit(trip.assignmentId, selected, note.trim());
  }

  return (
    <Dialog open={Boolean(trip)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث حالة الرحلة</DialogTitle>
          <DialogDescription>
            {trip ? `${trip.origin} ← ${trip.destination} — ${trip.travelDate}` : ""}
            {trip ? ` — الحالة الحالية: ${OPERATOR_TRIP_STATUS_LABELS[trip.operatorStatus] ?? trip.operatorStatus}` : ""}
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش تحديثات تانية متاحة للرحلة دي.</p>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={selected ?? ""} onValueChange={(v) => setSelected(v as OperatorTripStatus)}>
              <div className="grid gap-2">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                      selected === opt ? "border-accent bg-accent/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={opt} id={`status-${opt}`} />
                    <span className="font-bold text-primary">{OPERATOR_TRIP_STATUS_LABELS[opt] ?? opt}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>

            {needsNote ? (
              <div className="space-y-1.5">
                <Label>السبب / ملاحظة (مطلوب)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="اكتب سبب التأخير/المشكلة..."
                  rows={3}
                />
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!selected || (needsNote && !note.trim()) || updating}
            onClick={submit}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {updating ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReassignDialog({
  trip,
  drivers,
  vehicles,
  loadingFleet,
  updating,
  onClose,
  onSubmit,
}: {
  trip: OperatorTrip | null;
  drivers: OperatorDriver[];
  vehicles: OperatorVehicle[];
  loadingFleet: boolean;
  updating: boolean;
  onClose: () => void;
  onSubmit: (assignmentId: string, updates: { vehicleId?: string; driverId?: string }) => void;
}) {
  const [vehicleId, setVehicleId] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");

  function handleOpenChange(open: boolean) {
    if (!open) {
      setVehicleId("");
      setDriverId("");
      onClose();
    }
  }

  function submit() {
    if (!trip) return;
    const updates: { vehicleId?: string; driverId?: string } = {};
    if (vehicleId) updates.vehicleId = vehicleId;
    if (driverId) updates.driverId = driverId;
    if (!updates.vehicleId && !updates.driverId) return;
    onSubmit(trip.assignmentId, updates);
  }

  const canSubmit = Boolean(vehicleId || driverId) && !updating;

  return (
    <Dialog open={Boolean(trip)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تغيير السواق/العربية</DialogTitle>
          <DialogDescription>
            {trip ? `${trip.origin} ← ${trip.destination} — ${trip.travelDate}` : ""}
            {trip ? ` — الحالي: ${trip.vehiclePlate} / ${trip.driverName ?? "بدون سواق"}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loadingFleet ? (
          <p className="text-sm text-muted-foreground">جاري تحميل أسطولك…</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>عربية جديدة (اختياري)</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="سيب العربية زي ما هي" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate_number} — {v.vehicle_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>سواق جديد (اختياري)</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="سيب السواق زي ما هو" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name} — {d.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              سيب أي حقل فاضي عشان تسيبه زي ما هو. لو العربية أو السواق ليهم مستندات منتهية، أو
              متعيّنين على رحلة تانية قريبة في نفس اليوم، هيترفض التعديل تلقائيًا.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!canSubmit}
            onClick={submit}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {updating ? "جاري الحفظ..." : "حفظ التعديل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
