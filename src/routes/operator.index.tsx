import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RouteIcon, Truck, Users, Wallet } from "lucide-react";

import { OperatorAuthError, OperatorLoading } from "@/components/operator/operator-shell";
import { ListRow, PageHeader, PortalCard, StatCard, StatusPill, statusTone } from "@/components/portal/portal-ui";
import {
  formatOperatorMoney,
  getOperatorDashboard,
  getOperatorTrips,
  isOperatorAuthError,
  OPERATOR_TRIP_STATUS_LABELS,
  PAYOUT_MODEL_LABELS,
} from "@/lib/operator";
import { useOperatorToken } from "@/lib/operator-session";

export const Route = createFileRoute("/operator/")({
  head: () => ({ meta: [{ title: "نظرة عامة — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: OperatorOverview,
});

const CLOSED_STATUSES = ["completed", "cancelled", "rejected", "no_show"];

function OperatorOverview() {
  const token = useOperatorToken();
  const q = useQuery({
    queryKey: ["operator-dashboard", token],
    queryFn: () => getOperatorDashboard(token),
    retry: false,
    enabled: Boolean(token),
  });
  const tripsQuery = useQuery({
    queryKey: ["operator-trips", token],
    queryFn: () => getOperatorTrips(token),
    retry: false,
    enabled: Boolean(token),
  });
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError || !q.data) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const d = q.data;
  const rateHint =
    d.payoutModel === "fixed_per_trip" ? `${formatOperatorMoney(d.fixedAmountUsd ?? 0)} لكل رحلة` :
    d.payoutModel === "percentage_of_ticket" ? `${((d.percentageRate ?? 0) * 100).toFixed(0)}% من قيمة التذاكر` :
    `${formatOperatorMoney(d.perSeatAmountUsd ?? 0)} لكل مقعد`;

  const upcoming = (tripsQuery.data ?? [])
    .filter((trip) => !CLOSED_STATUSES.includes(trip.operatorStatus))
    .sort((a, b) =>
      `${a.travelDate} ${a.departureTime ?? ""}`.localeCompare(`${b.travelDate} ${b.departureTime ?? ""}`),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`أهلاً، ${d.name}`}
        subtitle={`نظام الدفع: ${PAYOUT_MODEL_LABELS[d.payoutModel]} — ${rateHint}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Truck} label="عربياتك" value={String(d.vehiclesCount)} />
        <StatCard icon={Users} label="سائقينك" value={String(d.driversCount)} />
        <StatCard icon={RouteIcon} label="رحلات هذا الشهر" value={String(d.currentMonthTrips)} />
        <StatCard highlight icon={Wallet} label="مستحق هذا الشهر" value={formatOperatorMoney(d.currentMonthAmountDueUsd)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalCard
          title="الرحلات القادمة"
          action={
            <Link to="/operator/trips" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
              عرض الكل
            </Link>
          }
        >
          {tripsQuery.isPending ? (
            <p className="text-sm text-slate-500">جاري التحميل...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">مفيش رحلات قادمة مخصصة لك دلوقتي.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((trip) => (
                <ListRow
                  key={trip.assignmentId}
                  title={`${trip.origin} ← ${trip.destination}`}
                  subtitle={`${trip.travelDate}${trip.departureTime ? ` · ${trip.departureTime.slice(0, 5)}` : ""} · ${trip.driverName ?? "بدون سائق"} · ${trip.seatsCount} مقعد`}
                  end={
                    <StatusPill tone={statusTone(trip.operatorStatus)}>
                      {OPERATOR_TRIP_STATUS_LABELS[trip.operatorStatus] ?? trip.operatorStatus}
                    </StatusPill>
                  }
                />
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard
          title="نظرة على الأسطول والأداء"
          action={
            <Link to="/operator/fleet" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
              إدارة الأسطول
            </Link>
          }
        >
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">إجمالي الرحلات (كل الوقت)</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-slate-900">{d.lifetimeTrips}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">إجمالي المستحق (كل الوقت)</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                {formatOperatorMoney(d.lifetimeAmountDueUsd)}
              </dd>
            </div>
          </dl>
        </PortalCard>
      </div>
    </div>
  );
}
