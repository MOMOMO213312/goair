import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { GHLoading, GHEmpty, GHAuthError } from "@/components/ground-handling/ground-handling-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getGroundHandlingRequests,
  updateGroundHandlingRequestStatus,
  assignGroundHandlingStaff,
  listGroundHandlingStaff,
  groundHandlingStatusLabel,
  formatGroundHandlingDate,
  isGroundHandlingAuthError,
  REQUEST_STATUS_ORDER,
  type GroundHandlingRequest,
  type GroundHandlingRequestStatus,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/requests")({
  head: () => ({ meta: [{ title: "طلبات الخدمات — بوابة GOAIR للخدمات الأرضية" }] }),
  component: RequestsPage,
});

// The next status a partner can move a request to from its current status,
// following: مطلوب → مقبول → قيد التجهيز → تم تعيين موظف → قيد التنفيذ → مكتمل
const NEXT_STATUS: Partial<Record<GroundHandlingRequestStatus, GroundHandlingRequestStatus>> = {
  requested: "accepted",
  accepted: "preparing",
  preparing: "staff_assigned",
  staff_assigned: "in_progress",
  in_progress: "completed",
};

function RequestsPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<GroundHandlingRequestStatus | null>(null);

  const requestsQuery = useQuery({
    queryKey: ["ground-handling-requests", token, statusFilter],
    queryFn: () => getGroundHandlingRequests(token as string, statusFilter),
    retry: false,
    enabled: Boolean(token),
  });

  const staffQuery = useQuery({
    queryKey: ["ground-handling-staff-list", token],
    queryFn: () => listGroundHandlingStaff(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ground-handling-requests", token] });
    queryClient.invalidateQueries({ queryKey: ["ground-handling-dashboard", token] });
  }

  if (requestsQuery.isError) {
    if (isGroundHandlingAuthError(requestsQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const requests = requestsQuery.data ?? [];
  const staff = staffQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
            statusFilter === null ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          الكل
        </button>
        {REQUEST_STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
              statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {groundHandlingStatusLabel(s)}
          </button>
        ))}
      </div>

      {requestsQuery.isPending ? (
        <GHLoading />
      ) : requests.length === 0 ? (
        <GHEmpty>مفيش طلبات في القسم ده دلوقتي.</GHEmpty>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard key={req.requestId} request={req} token={token} staff={staff} onDone={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  token,
  staff,
  onDone,
}: {
  request: GroundHandlingRequest;
  token: string;
  staff: { id: string; fullName: string; isActive: boolean }[];
  onDone: () => void;
}) {
  const [notes, setNotes] = useState(request.partnerNotes ?? "");
  const [busy, setBusy] = useState(false);
  const isClosed = request.status === "completed" || request.status === "cancelled";
  const next = NEXT_STATUS[request.status];

  async function advance() {
    if (!next) return;
    setBusy(true);
    try {
      await updateGroundHandlingRequestStatus(token, request.requestId, next, notes.trim() || null);
      toast.success("تم تحديث حالة الطلب.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await updateGroundHandlingRequestStatus(token, request.requestId, "cancelled", notes.trim() || null);
      toast.success("تم إلغاء الطلب.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(staffId: string) {
    setBusy(true);
    try {
      await assignGroundHandlingStaff(token, request.requestId, staffId);
      toast.success("تم تعيين الموظف.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={`space-y-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] ${request.isUrgent ? "border-destructive/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-primary">
            {request.serviceName}
            {request.isUrgent ? <span className="mr-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">عاجل</span> : null}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {request.passengerName} — {request.phoneNumber}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.origin} ← {request.destination} · {formatGroundHandlingDate(request.travelDate)}
            {request.flightNumber ? ` · رحلة ${request.flightNumber}` : ""}
            {request.terminal ? ` · ${request.terminal}` : ""}
            {request.direction ? ` · ${request.direction === "arrival" ? "وصول" : "مغادرة"}` : ""}
            {request.ticketCode ? ` · تذكرة ${request.ticketCode}` : ""}
          </p>
          {request.assignedStaffName ? (
            <p className="mt-0.5 text-xs font-bold text-primary">الموظف المسؤول: {request.assignedStaffName}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
          {groundHandlingStatusLabel(request.status)}
        </span>
      </div>

      {!isClosed ? (
        <>
          <Textarea placeholder="ملاحظات (اختياري)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex flex-wrap items-center gap-2">
            {request.status === "preparing" || request.status === "staff_assigned" ? (
              <Select onValueChange={handleAssign} disabled={busy} {...(request.assignedStaffId ? { value: request.assignedStaffId } : {})}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="تعيين موظف" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter((s) => s.isActive).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {next ? (
              <Button size="sm" disabled={busy} className="bg-primary font-bold text-primary-foreground hover:bg-primary/90" onClick={advance}>
                {groundHandlingStatusLabel(next)} ←
              </Button>
            ) : null}
            <Button size="sm" variant="outline" disabled={busy} onClick={cancel}>
              إلغاء الطلب
            </Button>
          </div>
        </>
      ) : request.partnerNotes ? (
        <p className="text-sm text-muted-foreground">ملاحظات: {request.partnerNotes}</p>
      ) : null}
    </Card>
  );
}
