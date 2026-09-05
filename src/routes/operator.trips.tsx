import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useOperatorToken } from "@/lib/operator-session";
import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOperatorMoney, getOperatorTrips, isOperatorAuthError } from "@/lib/operator";

export const Route = createFileRoute("/operator/trips")({
  head: () => ({ meta: [{ title: "الرحلات المخصصة — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: TripsPage,
});

function TripsPage() {
  const token = useOperatorToken();
  const q = useQuery({ queryKey: ["operator-trips", token], queryFn: () => getOperatorTrips(token), retry: false, enabled: Boolean(token) });
  if (!token) return null;
  if (q.isPending) return <OperatorLoading />;
  if (q.isError) return isOperatorAuthError(q.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const trips = q.data ?? [];
  return (
    <OperatorSection title="الرحلات المخصصة لأسطولك">
      {trips.length === 0 ? (
        <p className="text-sm text-muted-foreground">مفيش رحلات متخصصة لعربياتك لسه.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الخط</TableHead>
                <TableHead className="text-right">العربية</TableHead>
                <TableHead className="text-right">السائق</TableHead>
                <TableHead className="text-right">المقاعد</TableHead>
                <TableHead className="text-right">المستحق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => (
                <TableRow key={t.assignmentId}>
                  <TableCell className="font-semibold text-primary">{t.travelDate}</TableCell>
                  <TableCell>{t.origin} ← {t.destination}</TableCell>
                  <TableCell>{t.vehiclePlate}</TableCell>
                  <TableCell>{t.driverName ?? "—"}</TableCell>
                  <TableCell>{t.seatsCount}</TableCell>
                  <TableCell className="font-bold text-accent">{formatOperatorMoney(t.amountDueUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </OperatorSection>
  );
}
