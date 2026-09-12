import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
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

function StatCard({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight
          ? "rounded-xl border-accent/30 bg-primary p-5 text-primary-foreground shadow-[var(--shadow-card)]"
          : "rounded-xl border-border/80 bg-card p-5 shadow-[var(--shadow-card)]"
      }
    >
      <p className={highlight ? "text-sm text-primary-foreground/80" : "text-sm text-muted-foreground"}>{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      {hint ? (
        <p className={highlight ? "mt-1 text-xs text-primary-foreground/70" : "mt-1 text-xs text-muted-foreground"}>
          {hint}
        </p>
      ) : null}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إيراد اليوم" value={money(s.revenueTodayUsd)} hint={`${s.bookingsToday} حجز اليوم`} highlight />
        <StatCard label="إيراد آخر 7 أيام" value={money(s.revenueWeekUsd)} hint={`${s.bookingsWeek} حجز`} />
        <StatCard label="إيراد الشهر الحالي" value={money(s.revenueMonthUsd)} hint={`${s.bookingsMonth} حجز`} />
        <StatCard
          label="تقييم العملاء"
          value={s.averageRating != null ? `${s.averageRating} / 5` : "—"}
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

      <Section title="الإيراد المؤكد — آخر 14 يوم">
        {s.revenueTrend14d.every((d) => d.revenueUsd === 0) ? (
          <p className="text-sm text-muted-foreground">لا يوجد إيراد مؤكد في الفترة دي لسه.</p>
        ) : (
          <div className="flex h-32 items-end gap-1.5">
            {s.revenueTrend14d.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${money(d.revenueUsd)}`}>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(4, (d.revenueUsd / maxTrend) * 100)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="الحجوزات حسب الحالة">
          {s.bookingsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>
          ) : (
            <div className="space-y-1.5">
              {s.bookingsByStatus.map((row) => (
                <div key={row.status} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{BOOKING_STATUS_LABELS[row.status] ?? row.status}</span>
                  <span className="font-bold text-primary">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="الأسطول والشركاء النشطين">
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
        </Section>
      </div>

      <Section title="أكثر الخطوط طلبًا (آخر 30 يوم)">
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
      </Section>

      <Section title="أداء شركاء المبيعات (آخر 30 يوم)">
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
      </Section>
    </div>
  );
}
