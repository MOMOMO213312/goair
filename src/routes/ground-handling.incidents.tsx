import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { GHLoading, GHEmpty, GHAuthError } from "@/components/ground-handling/ground-handling-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listGroundHandlingIncidents,
  updateGroundHandlingIncident,
  groundHandlingIncidentSeverityLabel,
  groundHandlingIncidentStatusLabel,
  isGroundHandlingAuthError,
  type GroundHandlingIncidentStatus,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/incidents")({
  head: () => ({ meta: [{ title: "المشاكل — بوابة GOAIR للخدمات الأرضية" }] }),
  component: IncidentsPage,
});

const SEVERITY_TONE: Record<string, string> = {
  low: "bg-mist text-muted-foreground",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-destructive/10 text-destructive",
};

const STATUS_TABS: { value: GroundHandlingIncidentStatus | null; label: string }[] = [
  { value: "open", label: "مفتوحة" },
  { value: "in_progress", label: "جاري الحل" },
  { value: "resolved", label: "تم الحل" },
  { value: null, label: "الكل" },
];

function IncidentsPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<GroundHandlingIncidentStatus | null>("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const incidentsQuery = useQuery({
    queryKey: ["ground-handling-incidents", token, status],
    queryFn: () => listGroundHandlingIncidents(token as string, status),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  if (incidentsQuery.isError) {
    if (isGroundHandlingAuthError(incidentsQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const incidents = incidentsQuery.data ?? [];

  async function setIncidentStatus(id: string, next: GroundHandlingIncidentStatus) {
    setBusyId(id);
    try {
      await updateGroundHandlingIncident(token as string, id, next, notesById[id] ?? null);
      toast.success("تم تحديث حالة المشكلة.");
      queryClient.invalidateQueries({ queryKey: ["ground-handling-incidents", token] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setStatus(t.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
              status === t.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {incidentsQuery.isPending ? (
        <GHLoading />
      ) : incidents.length === 0 ? (
        <GHEmpty>مفيش مشاكل في القسم ده. 🎉</GHEmpty>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="space-y-2 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-primary">{inc.serviceName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {inc.passengerName}
                    {inc.ticketCode ? ` · تذكرة ${inc.ticketCode}` : ""}
                  </p>
                  <p className="mt-1 text-sm">{inc.description}</p>
                  {inc.resolutionNotes ? (
                    <p className="mt-1 text-sm text-emerald-700">الحل: {inc.resolutionNotes}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${SEVERITY_TONE[inc.severity]}`}>
                    {groundHandlingIncidentSeverityLabel(inc.severity)}
                  </span>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
                    {groundHandlingIncidentStatusLabel(inc.status)}
                  </span>
                </div>
              </div>

              {inc.status !== "resolved" ? (
                <>
                  <Textarea
                    placeholder="ملاحظات الحل (اختياري)"
                    rows={2}
                    value={notesById[inc.id] ?? ""}
                    onChange={(e) => setNotesById({ ...notesById, [inc.id]: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    {inc.status === "open" ? (
                      <Button size="sm" variant="outline" disabled={busyId === inc.id} onClick={() => setIncidentStatus(inc.id, "in_progress")}>
                        جاري الحل
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={busyId === inc.id}
                      className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                      onClick={() => setIncidentStatus(inc.id, "resolved")}
                    >
                      تسجيل كـ"تم الحل"
                    </Button>
                  </div>
                </>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
