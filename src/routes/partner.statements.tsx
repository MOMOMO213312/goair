import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";

import {
  PartnerAuthError,
  PartnerSection,
  PartnerTableSkeleton,
  PartnerTempError,
  StatementStatusBadge,
} from "@/components/partner/partner-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatPartnerMoney,
  getPartnerStatements,
  isPartnerAuthError,
} from "@/lib/partner";

export const Route = createFileRoute("/partner/statements")({
  head: () => ({
    meta: [
      { title: "كشوف حساب الشركاء — GoAir" },
      { name: "description", content: "كشوف الحساب الشهرية والعمولات المستحقة لشركاء GoAir." },
      { property: "og:title", content: "كشوف حساب الشركاء — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatementsPage,
});

function StatementsPage() {
  const token = usePartnerToken();
  const query = useQuery({
    queryKey: ["partner-statements", token],
    queryFn: () => getPartnerStatements(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <PartnerAuthError />;

  const rows = query.data ?? [];

  return (
    <PartnerSection title="كشوف الحساب">
      {query.isPending ? (
        <PartnerTableSkeleton rows={4} cols={7} />
      ) : query.isError ? (
        isPartnerAuthError(query.error) ? <PartnerAuthError /> : <PartnerTempError />
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
                  <TableCell>{formatPartnerMoney(row.totalTicketValueUsd)}</TableCell>
                  <TableCell className="font-bold text-accent">{formatPartnerMoney(row.commissionDueUsd)}</TableCell>
                  <TableCell>
                    <StatementStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PartnerSection>
  );
}
