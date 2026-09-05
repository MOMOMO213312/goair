import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useState } from "react";

import {
  BookingStatusBadge,
  PartnerAuthError,
  PartnerSection,
  PartnerTableSkeleton,
  PartnerTempError,
} from "@/components/partner/partner-shell";
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
  formatDate,
  formatPartnerMoney,
  getPartnerBookings,
  isoDaysAgo,
  isPartnerAuthError,
  todayIso,
} from "@/lib/partner";

export const Route = createFileRoute("/partner/bookings")({
  head: () => ({
    meta: [
      { title: "حجوزات الشركاء — GoAir" },
      { name: "description", content: "حجوزات مسافري شركتك مع القيمة والعمولة لكل حجز." },
      { property: "og:title", content: "حجوزات الشركاء — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const token = usePartnerToken();
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [applied, setApplied] = useState({ from: isoDaysAgo(30), to: todayIso() });

  const query = useQuery({
    queryKey: ["partner-bookings", token, applied.from, applied.to],
    queryFn: () => getPartnerBookings(token, applied.from || null, applied.to || null),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <PartnerAuthError />;

  return (
    <PartnerSection
      title="الحجوزات"
      description="بيانات المسافرين الشخصية محفوظة ولا تُعرض هنا."
    >
      <form
        className="mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(range);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="pb-from">من تاريخ</Label>
          <Input
            id="pb-from"
            type="date"
            value={range.from}
            onChange={(event) => setRange({ ...range, from: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pb-to">إلى تاريخ</Label>
          <Input
            id="pb-to"
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
        <PartnerTableSkeleton rows={6} cols={6} />
      ) : query.isError ? (
        isPartnerAuthError(query.error) ? <PartnerAuthError /> : <PartnerTempError />
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
                    <BookingStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{formatPartnerMoney(row.expectedTotalUsd)}</TableCell>
                  <TableCell className="font-bold text-accent">{formatPartnerMoney(row.commissionUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PartnerSection>
  );
}
