import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  formatGroundHandlingDate,
  getGroundHandlingDashboard,
  getGroundHandlingRequests,
  groundHandlingStatusLabel,
  isGroundHandlingAuthError,
  updateGroundHandlingRequestStatus,
  type GroundHandlingRequest,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/")({
  component: GroundHandlingDashboardPage,
});

const STATUS_TABS: { value: string | null; label: string }[] = [
  { value: null, label: "الكل" },
  { value: "pending", label: "مطلوبة" },
  { value: "in_progress", label: "جاري التجهيز" },
  { value: "done", label: "تمت" },
];

function GroundHandlingDashboardPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["ground-handling-dashboard", token],
    queryFn: () => getGroundHandlingDashboard(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  const requestsQuery = useQuery({
    queryKey: ["ground-handling-requests", token, statusFilter],
    queryFn: () => getGroundHandlingRequests(token as string, statusFilter),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  if (dashboardQuery.isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    if (isGroundHandlingAuthError(dashboardQuery.error)) signOut();
    return (
      <Card className="rounded-xl border-border/80 p-6 text-center text-sm text-muted-foreground">
        حصل خطأ مؤقت. حاول تاني.
      </Card>
    );
  }

  const dashboard = dashboardQuery.data;
  const requests = requestsQuery.data ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ground-handling-dashboard", token] });
    queryClient.invalidateQueries({ queryKey: ["ground-handling-requests", token] });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-lg font-extrabold text-primary">{dashboard.name}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {dashboard.airportCode}
          {dashboard.country ? ` · ${dashboard.country}` : ""}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="مطلوبة" value={dashboard.pendingCount} />
          <StatCard label="جاري التجهيز" value={dashboard.inProgressCount} />
          <StatCard label="تمت اليوم" value={dashboard.doneTodayCount} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                statusFilter === tab.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {requestsQuery.isPending ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            مفيش طلبات في القسم ده دلوقتي.
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.requestId} request={req} token={token} onDone={invalidate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-xl border-border/80 p-4 text-center shadow-[var(--shadow-card)]">
      <p className="font-display text-3xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function RequestCard({
  request,
  token,
  onDone,
}: {
  request: GroundHandlingRequest;
  token: string;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState(request.partnerNotes ?? "");
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "in_progress" | "done" | "cancelled") {
    setBusy(true);
    try {
      await updateGroundHandlingRequestStatus(token, request.requestId, status, notes.trim() || null);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-primary">{request.serviceName}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {request.passengerName} — {request.phoneNumber}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.origin} ← {request.destination} · {formatGroundHandlingDate(request.travelDate)}
            {request.flightNumber ? ` · رحلة ${request.flightNumber}` : ""}
            {request.ticketCode ? ` · تذكرة ${request.ticketCode}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
          {groundHandlingStatusLabel(request.status)}
        </span>
      </div>

      {request.status !== "done" && request.status !== "cancelled" ? (
        <>
          <Textarea
            placeholder="ملاحظات (اختياري)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {request.status !== "in_progress" ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("in_progress")}>
                بدء التجهيز
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={busy}
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
              onClick={() => setStatus("done")}
            >
              تم التنفيذ
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("cancelled")}>
              إلغاء
            </Button>
          </div>
        </>
      ) : request.partnerNotes ? (
        <p className="text-sm text-muted-foreground">ملاحظات: {request.partnerNotes}</p>
      ) : null}
    </Card>
  );
}
