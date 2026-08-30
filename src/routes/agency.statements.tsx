import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  AgencyAuthError,
  AgencySection,
  AgencyStatementStatusBadge,
  AgencyTableSkeleton,
  AgencyTempError,
} from "@/components/agency/agency-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAgencyMoney,
  formatDate,
  getAgencyStatements,
  isAgencyAuthError,
} from "@/lib/agency";

export const Route = createFileRoute("/agency/statements")({
  head: () => ({
    meta: [
      { title: "كشوف حساب الوكالة — GoAir" },
      { name: "description", content: "كشوف الحساب الشهرية والعمولات المستحقة لوكالتك." },
      { property: "og:title", content: "كشوف حساب الوكالة — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatementsPage,
});

function StatementsPage() {
  const { token } = Route.useSearch();
  const query = useQuery({
    queryKey: ["agency-statements", token],
    queryFn: () => getAgencyStatements(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <AgencyAuthError />;

  const rows = query.data ?? [];

  return (
    <AgencySection title="كشوف الحساب">
      {query.isPending ? (
        <AgencyTableSkeleton rows={4} cols={7} />
      ) : query.isError ? (
        isAgencyAuthError(query.error) ? <AgencyAuthError /> : <AgencyTempError />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          أول كشف حساب هيظهر هنا بعد نهاية أول شهر.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">عدد الحجوزات</TableHead>
                <TableHead className="text-right">إجمالي قيمة التذاكر</TableHead>
                <TableHead className="text-right">العمولة المستحقة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold text-primary">{formatDate(row.periodStart)}</TableCell>
                  <TableCell>{formatDate(row.periodEnd)}</TableCell>
                  <TableCell>{row.totalBookings}</TableCell>
                  <TableCell>{formatAgencyMoney(row.totalTicketValueUsd)}</TableCell>
                  <TableCell className="font-bold text-accent">{formatAgencyMoney(row.commissionDueUsd)}</TableCell>
                  <TableCell>
                    <AgencyStatementStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AgencySection>
  );
}
