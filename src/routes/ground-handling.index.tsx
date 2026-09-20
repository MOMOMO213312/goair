import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Inbox,
  PlaneTakeoff,
} from "lucide-react";

import { GHEmpty, GHLoading } from "@/components/ground-handling/ground-handling-shell";
import {
  ListRow,
  PageHeader,
  PortalCard,
  StatCard,
  StatusPill,
  statusTone,
} from "@/components/portal/portal-ui";
import {
  formatGroundHandlingDate,
  getGroundHandlingDashboard,
  getGroundHandlingRequests,
  groundHandlingStatusLabel,
  isGroundHandlingAuthError,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — بوابة GOAIR للخدمات الأرضية" }] }),
  component: GroundHandlingDashboardPage,
});

const CLOSED_STATUSES = ["completed", "cancelled"];

function GroundHandlingDashboardPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();

  const dashboardQuery = useQuery({
    queryKey: ["ground-handling-dashboard", token],
    queryFn: () => getGroundHandlingDashboard(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  const requestsQuery = useQuery({
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
  const allRequests = requestsQuery.data ?? [];
  const urgentRequests = allRequests.filter((r) => r.isUrgent && !CLOSED_STATUSES.includes(r.status));
  const latestRequests = [...allRequests]
    .filter((r) => !CLOSED_STATUSES.includes(r.status))
    .sort((a, b) => (b.bookedAt ?? "").localeCompare(a.bookedAt ?? ""))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`عمليات اليوم — ${d.name}`}
        subtitle={`${d.airportCode}${d.country ? ` · ${d.country}` : ""}${!d.isActive ? " · (الحساب موقوف)" : ""}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="إجمالي الطلبات" value={d.totalCount} />
        <StatCard icon={Inbox} label="طلبات جديدة" value={d.newCount} />
        <StatCard icon={Clock} label="قيد التجهيز" value={d.preparingCount} />
        <StatCard icon={Activity} label="قيد التنفيذ" value={d.inProgressCount} />
        <StatCard icon={CheckCircle2} label="المكتملة اليوم" value={d.completedTodayCount} />
        <StatCard
          icon={AlertTriangle}
          label="طلبات عاجلة"
          value={d.urgentCount}
          className={d.urgentCount > 0 ? "border-red-200 bg-red-50" : undefined}
          valueClassName={d.urgentCount > 0 ? "text-red-600" : undefined}
        />
        <StatCard icon={PlaneTakeoff} label="رحلات اليوم" value={d.todayFlightsCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalCard
          title="طلبات عاجلة تحتاج انتباه"
          action={
            <Link to="/ground-handling/requests" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
              عرض كل الطلبات
            </Link>
          }
        >
          {urgentRequests.length === 0 ? (
            <p className="text-sm text-slate-500">مفيش طلبات عاجلة دلوقتي.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {urgentRequests.slice(0, 5).map((r) => (
                <ListRow
                  key={r.requestId}
                  title={r.serviceName}
                  subtitle={`${r.passengerName}${r.flightNumber ? ` · رحلة ${r.flightNumber}` : ""}`}
                  end={<StatusPill tone="danger">{groundHandlingStatusLabel(r.status)}</StatusPill>}
                />
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard
          title="أحدث الطلبات المفتوحة"
          action={
            <Link to="/ground-handling/flights" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
              رحلات اليوم
            </Link>
          }
        >
          {requestsQuery.isPending ? (
            <p className="text-sm text-slate-500">جاري التحميل...</p>
          ) : latestRequests.length === 0 ? (
            <p className="text-sm text-slate-500">مفيش طلبات مفتوحة.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestRequests.map((r) => (
                <ListRow
                  key={r.requestId}
                  title={r.serviceName}
                  subtitle={`${r.passengerName}${r.flightNumber ? ` · رحلة ${r.flightNumber}` : ""}`}
                  end={
                    <StatusPill tone={statusTone(r.status)}>{groundHandlingStatusLabel(r.status)}</StatusPill>
                  }
                />
              ))}
            </ul>
          )}
        </PortalCard>
      </div>

      <p className="text-xs text-slate-500">
        آخر تحديث: {formatGroundHandlingDate(new Date().toISOString())}
      </p>
    </div>
  );
}
