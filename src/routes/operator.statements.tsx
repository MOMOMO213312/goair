import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useOperatorToken } from "@/lib/operator-session";
import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOperatorMoney, getOperatorStatements, isOperatorAuthError } from "@/lib/operator";

export const Route = createFileRoute("/operator/statements")({
  head: () => ({ meta: [{ title: "كشوف الحساب — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: StatementsPage,
});

function StatementsPage() {
  const token = useOperatorToken();
  const q = useQuery({ queryKey: ["operator-statements", token], queryFn: () => getOperatorStatements(token), retry: false, enabled: Boolean(token) });
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const rows = q.data ?? [];
  return (
    <OperatorSection title="كشوف الحساب">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">أول كشف حساب هيظهر هنا بعد نهاية أول شهر.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">عدد الرحلات</TableHead>
                <TableHead className="text-right">المستحق</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-primary">{r.periodStart}</TableCell>
                  <TableCell>{r.periodEnd}</TableCell>
                  <TableCell>{r.totalTrips}</TableCell>
                  <TableCell className="font-bold text-accent">{formatOperatorMoney(r.amountDueUsd)}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </OperatorSection>
  );
}
