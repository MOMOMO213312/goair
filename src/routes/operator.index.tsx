import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperatorToken } from "@/lib/operator-session";
import { OperatorAuthError, OperatorLoading, OperatorStatCard } from "@/components/operator/operator-shell";
import { formatOperatorMoney, getOperatorDashboard, isOperatorAuthError, PAYOUT_MODEL_LABELS } from "@/lib/operator";

export const Route = createFileRoute("/operator/")({
  head: () => ({ meta: [{ title: "نظرة عامة — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: OperatorOverview,
});

function OperatorOverview() {
  const token = useOperatorToken();
  const q = useQuery({ queryKey: ["operator-dashboard", token], queryFn: () => getOperatorDashboard(token), retry: false, enabled: Boolean(token) });
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError || !q.data) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const d = q.data;
  const rateHint =
    d.payoutModel === "fixed_per_trip" ? `${formatOperatorMoney(d.fixedAmountUsd ?? 0)} لكل رحلة` :
    d.payoutModel === "percentage_of_ticket" ? `${((d.percentageRate ?? 0) * 100).toFixed(0)}% من قيمة التذاكر` :
    `${formatOperatorMoney(d.perSeatAmountUsd ?? 0)} لكل مقعد`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-extrabold text-primary">{d.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          نظام الدفع: {PAYOUT_MODEL_LABELS[d.payoutModel]} — {rateHint}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OperatorStatCard label="عربياتك" value={String(d.vehiclesCount)} />
        <OperatorStatCard label="سائقينك" value={String(d.driversCount)} />
        <OperatorStatCard label="رحلات هذا الشهر" value={String(d.currentMonthTrips)} />
        <OperatorStatCard label="مستحق هذا الشهر" value={formatOperatorMoney(d.currentMonthAmountDueUsd)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <OperatorStatCard label="إجمالي الرحلات (كل الوقت)" value={String(d.lifetimeTrips)} />
        <OperatorStatCard label="إجمالي المستحق (كل الوقت)" value={formatOperatorMoney(d.lifetimeAmountDueUsd)} />
      </div>
      {d.salesReferralCode ? (
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-extrabold text-primary">بيع مباشر لعملائك</h3>
              {d.pendingSettlementCount > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  عندك <span className="font-bold text-accent">{formatOperatorMoney(d.pendingSettlementUsd)}</span> مستحقة
                  عليك لـ GoAir من {d.pendingSettlementCount} حجز استلمت فلوسه بنفسك.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">احجز مباشرة لعميلك — هتتحوّل تلقائيًا لأسطولك.</p>
              )}
            </div>
            <Link
              to="/operator/sell"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90"
            >
              بيع لعميلي
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
