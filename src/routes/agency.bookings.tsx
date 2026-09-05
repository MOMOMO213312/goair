import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAgencyToken } from "@/lib/agency-session";
import { useState } from "react";

import {
  AgencyAuthError,
  AgencyBookingStatusBadge,
  AgencySection,
  AgencyTableSkeleton,
  AgencyTempError,
} from "@/components/agency/agency-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getAgencyBookings,
  isAgencyAuthError,
  isoDaysAgo,
  todayIso,
} from "@/lib/agency";

export const Route = createFileRoute("/agency/bookings")({
  head: () => ({
    meta: [
      { title: "حجوزات الوكالة — GoAir" },
      { name: "description", content: "حجوزات عملاء وكالتك مع القيمة والعمولة لكل حجز." },
      { property: "og:title", content: "حجوزات الوكالة — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const token = useAgencyToken();
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [applied, setApplied] = useState({ from: isoDaysAgo(30), to: todayIso() });

  const query = useQuery({
    queryKey: ["agency-bookings", token, applied.from, applied.to],
    queryFn: () => getAgencyBookings(token, applied.from || null, applied.to || null),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <AgencyAuthError />;

  return (
    <AgencySection
      title="الحجوزات"
      description="كل حجز جالك عبر رابط وكالتك أو حجزته بنفسك للعميل — بترتيب أحدث حجز أولًا."
    >
      <form
        className="mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(range);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="ab-from">من تاريخ</Label>
          <Input
            id="ab-from"
            type="date"
            value={range.from}
            onChange={(event) => setRange({ ...range, from: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ab-to">إلى تاريخ</Label>
          <Input
            id="ab-to"
            type="date"
            value={range.to}
            onChange={(event) => setRange({ ...range, to: event.target.value })}
          />
        </div>
        <Button type="submit" className="h-10 bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          تحديث
        </Button>
      </form>

      {query.isPending ? (
        <AgencyTableSkeleton rows={6} cols={6} />
      ) : query.isError ? (
        isAgencyAuthError(query.error) ? <AgencyAuthError /> : <AgencyTempError />
      ) : (query.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">مفيش حجوزات في الفترة المحددة.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">تاريخ الحجز</TableHead>
                <TableHead className="text-right">الراكب</TableHead>
                <TableHead className="text-right">تليفون الراكب</TableHead>
                <TableHead className="text-right">تاريخ الرحلة</TableHead>
                <TableHead className="text-right">الوجهة</TableHead>
                <TableHead className="text-right">عدد المقاعد</TableHead>
                <TableHead className="text-right">الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجمالي الحجز</TableHead>
                <TableHead className="text-right">العمولة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground">{formatDate(row.bookedAt)}</TableCell>
                  <TableCell className="font-semibold text-primary">{row.fullName}</TableCell>
                  <TableCell dir="ltr" className="text-right">{row.phoneNumber}</TableCell>
                  <TableCell>{formatDate(row.travelDate)}</TableCell>
                  <TableCell>{row.origin} ← {row.destination}</TableCell>
                  <TableCell>{row.seatsCount}</TableCell>
                  <TableCell>{row.paymentStatus}</TableCell>
                  <TableCell>
                    <AgencyBookingStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{formatAgencyMoney(row.expectedTotalUsd)}</TableCell>
                  <TableCell className="font-bold text-accent">{formatAgencyMoney(row.commissionUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AgencySection>
  );
}
