import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Star, TrendingUp, Wallet } from "lucide-react";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { DonutChart, PortalCard, StatCard } from "@/components/portal/portal-ui";
import { Card } from "@/components/ui/card";
import { useAdminToken } from "@/lib/admin-session";
import { adminGetDashboardStats, isAdminAuthError } from "@/lib/admin";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({ meta: [{ title: "نظرة عامة — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: OverviewPage,
});

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكدة",
  cancelled: "ملغاة",
};

function money(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

function OverviewPage() {
  const token = useAdminToken();

  const statsQuery = useQuery({
    queryKey: ["admin-dashboard-stats", token],
    queryFn: () => adminGetDashboardStats(token as string),
    retry: false,
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  if (!token) return null;
  if (statsQuery.isPending) return <AdminLoading />;
  if (statsQuery.isError) {
    return isAdminAuthError(statsQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const s = statsQuery.data;
  const pendingActionsCount =
    s.pendingPaymentsCount +
    s.unassignedConfirmedCount +
    s.pendingRentalApplicationsCount +
    s.pendingRentalVehiclesCount;
  const maxTrend = Math.max(1, ...s.revenueTrend14d.map((d) => d.revenueUsd));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="إيراد اليوم" value={money(s.revenueTodayUsd)} hint={`${s.bookingsToday} حجز اليوم`} highlight />
        <StatCard icon={TrendingUp} label="إيراد آخر 7 أيام" value={money(s.revenueWeekUsd)} hint={`${s.bookingsWeek} حجز`} />
        <StatCard icon={CalendarDays} label="إيراد الشهر الحالي" value={money(s.revenueMonthUsd)} hint={`${s.bookingsMonth} حجز`} />
        <StatCard
          icon={Star}
          label="تقييم العملاء"
          value={s.averageRating != null ? `${s.averageRating} من 5` : "—"}
          hint={`${s.ratingsCount} تقييم`}
        />
      </div>

      {pendingActionsCount > 0 ? (
        <Card className="rounded-xl border-accent/40 bg-accent/10 p-4 text-sm font-bold text-primary shadow-[var(--shadow-card)]">
          فيه {pendingActionsCount} إجراء محتاج مراجعتك دلوقتي: {s.pendingPaymentsCount} دفعة، {s.unassignedConfirmedCount}{" "}
          حجز محتاج تخصيص سائق، {s.pendingRentalApplicationsCount} طلب تأجير، {s.pendingRentalVehiclesCount} عربية تأجير
          محتاجة مراجعة.
        </Card>
      ) : null}

      <PortalCard title="الإيراد المؤكد — آخر 14 يوم">
        {s.revenueTrend14d.every((d) => d.revenueUsd === 0) ? (
          <p className="text-sm text-muted-foreground">لا يوجد إيراد مؤكد في الفترة دي لسه.</p>
        ) : (
          <div className="flex h-44 items-stretch gap-1.5">
            {s.revenueTrend14d.map((d) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${d.day}: ${money(d.revenueUsd)}`}
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[var(--primary)] to-[var(--portal-accent)]"
                    style={{ height: `${Math.max(4, (d.revenueUsd / maxTrend) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </PortalCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PortalCard title="الحجوزات حسب الحالة">
          {s.bookingsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
          ) : (
            <DonutChart
              centerLabel="إجمالي الحجوزات"
              slices={s.bookingsByStatus.map((row) => ({
                label: BOOKING_STATUS_LABELS[row.status] ?? row.status,
                value: row.count,
                color: STATUS_COLORS[row.status] ?? "#94a3b8",
              }))}
            />
          )}
        </PortalCard>

        <PortalCard title="الأسطول والشركاء النشطين">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">سائقين نشطين</span>
              <span className="font-bold text-primary">{s.activeDriversCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">عربيات نشطة</span>
              <span className="font-bold text-primary">{s.activeVehiclesCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">شركات نقل نشطة</span>
              <span className="font-bold text-primary">{s.activeOperatorsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">شركاء مبيعات نشطين</span>
              <span className="font-bold text-primary">{s.activePartnersCount}</span>
            </div>
          </div>
        </PortalCard>
      </div>

      <PortalCard title="أكثر الخطوط طلبًا (آخر 30 يوم)">
        {s.topRoutes.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد حجوزات كافية بعد.</p>
        ) : (
          <div className="space-y-1.5">
            {s.topRoutes.map((row, i) => (
              <div key={`${row.origin}-${row.destination}-${i}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {row.origin} ← {row.destination}
                </span>
                <span className="font-bold text-primary">
                  {row.bookingsCount} حجز · {money(row.revenueUsd)}
                </span>
              </div>
            ))}
          </div>
        )}
      </PortalCard>

      <PortalCard title="أداء شركاء المبيعات (آخر 30 يوم)">
        {s.partnerPerformance.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد حجوزات عبر شركاء مبيعات في الفترة دي بعد.</p>
        ) : (
          <div className="space-y-1.5">
            {s.partnerPerformance.map((row, i) => (
              <div key={`${row.partnerName}-${i}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {row.partnerName} ({row.partnerType === "airline" ? "شركة طيران" : "وكالة سياحة"})
                </span>
                <span className="font-bold text-primary">
                  {row.bookingsCount} حجز · {money(row.revenueUsd)} · عمولة {money(row.commissionUsd)}
                </span>
              </div>
            ))}
          </div>
        )}
      </PortalCard>
    </div>
  );
}
