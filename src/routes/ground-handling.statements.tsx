import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GHLoading, GHEmpty, GHAuthError, GHStatCard } from "@/components/ground-handling/ground-handling-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getGroundHandlingStatements,
  getGroundHandlingUnsettledSummary,
  groundHandlingStatementStatusLabel,
  formatGroundHandlingDate,
  isGroundHandlingAuthError,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/statements")({
  head: () => ({ meta: [{ title: "التسويات المالية — بوابة GOAIR للخدمات الأرضية" }] }),
  component: StatementsPage,
});

const STATUS_TONE: Record<string, string> = {
  draft: "bg-mist text-primary",
  sent: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
};

function StatementsPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();

  const summaryQuery = useQuery({
    queryKey: ["ground-handling-unsettled", token],
    queryFn: () => getGroundHandlingUnsettledSummary(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  const statementsQuery = useQuery({
    queryKey: ["ground-handling-statements", token],
    queryFn: () => getGroundHandlingStatements(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (statementsQuery.isError) {
    if (isGroundHandlingAuthError(statementsQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const statements = statementsQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <div className="space-y-5">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <GHStatCard label="خدمات مكتملة غير مسوّاة" value={summary.unsettledCount} />
          <GHStatCard label="إجمالي المستحق غير المسوّى" value={`$${summary.unsettledTotalUsd.toFixed(2)}`} />
        </div>
      ) : null}

      {statementsQuery.isPending ? (
        <GHLoading />
      ) : statements.length === 0 ? (
        <GHEmpty>مفيش تسويات سابقة. تقوم GOAIR بإصدار كشف الحساب دوريًا.</GHEmpty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الفترة</TableHead>
                <TableHead className="text-right">عدد الخدمات المكتملة</TableHead>
                <TableHead className="text-right">إجمالي المستحق</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {formatGroundHandlingDate(s.periodStart)} — {formatGroundHandlingDate(s.periodEnd)}
                  </TableCell>
                  <TableCell>{s.totalCompleted}</TableCell>
                  <TableCell>${s.totalDueUsd.toFixed(2)}</TableCell>
                  <TableCell>${s.paidUsd.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-primary">${s.remainingUsd.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_TONE[s.status] ?? ""}`}>
                      {groundHandlingStatementStatusLabel(s.status)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
