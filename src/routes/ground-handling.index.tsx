import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, PlaneTakeoff } from "lucide-react";

import { GHLoading, GHStatCard, GHEmpty } from "@/components/ground-handling/ground-handling-shell";
import { Card } from "@/components/ui/card";
import {
  getGroundHandlingDashboard,
  getGroundHandlingRequests,
  groundHandlingStatusLabel,
  isGroundHandlingAuthError,
  formatGroundHandlingDate,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — بوابة GOAIR للخدمات الأرضية" }] }),
  component: GroundHandlingDashboardPage,
});

function GroundHandlingDashboardPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();

  const dashboardQuery = useQuery({
    queryKey: ["ground-handling-dashboard", token],
    queryFn: () => getGroundHandlingDashboard(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  const urgentQuery = useQuery({
    queryKey: ["ground-handling-urgent", token],
    queryFn: () => getGroundHandlingRequests(token as string, null),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  if (dashboardQuery.isPending) return <GHLoading />;

  if (dashboardQuery.isError || !dashboardQuery.data) {
    if (isGroundHandlingAuthError(dashboardQuery.error)) signOut();
    return <GHEmpty>حصل خطأ مؤقت. حاول تاني.</GHEmpty>;
  }

  const d = dashboardQuery.data;
  const urgentRequests = (urgentQuery.data ?? []).filter(
    (r) => r.isUrgent && r.status !== "completed" && r.status !== "cancelled",
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-lg font-extrabold text-primary">{d.name}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {d.airportCode}
          {d.country ? ` · ${d.country}` : ""}
          {!d.isActive ? " · (الحساب موقوف)" : ""}
        </p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <GHStatCard label="إجمالي الطلبات" value={d.totalCount} />
          <GHStatCard label="طلبات جديدة" value={d.newCount} />
          <GHStatCard label="قيد التجهيز" value={d.preparingCount} />
          <GHStatCard label="قيد التنفيذ" value={d.inProgressCount} />
          <GHStatCard label="المكتملة اليوم" value={d.completedTodayCount} />
          <GHStatCard label="طلبات عاجلة" value={d.urgentCount} tone={d.urgentCount > 0 ? "urgent" : undefined} />
          <GHStatCard label="رحلات اليوم" value={d.todayFlightsCount} />
        </div>
      </section>

      {urgentRequests.length > 0 ? (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-extrabold text-destructive">
            <AlertTriangle className="size-4" aria-hidden />
            طلبات عاجلة تحتاج انتباه
          </h3>
          <div className="space-y-2">
            {urgentRequests.slice(0, 5).map((r) => (
              <Card key={r.requestId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-destructive/40 p-3">
                <div className="min-w-0 text-sm">
                  <span className="font-bold text-primary">{r.serviceName}</span>
                  <span className="text-muted-foreground"> — {r.passengerName}</span>
                  {r.flightNumber ? <span className="text-muted-foreground"> · رحلة {r.flightNumber}</span> : null}
                </div>
                <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
                  {groundHandlingStatusLabel(r.status)}
                </span>
              </Card>
            ))}
          </div>
          <Link to="/ground-handling/requests" className="mt-3 inline-block text-sm font-bold text-primary underline">
            عرض كل الطلبات ←
          </Link>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-display text-base font-extrabold text-primary">
          <PlaneTakeoff className="size-4" aria-hidden />
          نظرة سريعة
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/ground-handling/requests">
            <Card className="rounded-xl border-border/80 p-4 text-sm font-bold text-primary shadow-[var(--shadow-card)] hover:bg-muted">
              إدارة طلبات الخدمات ←
            </Card>
          </Link>
          <Link to="/ground-handling/flights">
            <Card className="rounded-xl border-border/80 p-4 text-sm font-bold text-primary shadow-[var(--shadow-card)] hover:bg-muted">
              رحلات اليوم ←
            </Card>
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          آخر تحديث: {formatGroundHandlingDate(new Date().toISOString())}
        </p>
      </section>
    </div>
  );
}
