import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useState } from "react";
import { toast } from "sonner";

import {
  BookingStatusBadge,
  LifecycleBadge,
  PartnerAuthError,
  PartnerSection,
  PartnerTableSkeleton,
  PartnerTempError,
} from "@/components/partner/partner-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelBusinessBooking,
  exportPartnerBookingsCsv,
  formatDate,
  formatPartnerMoney,
  getPartnerBookings,
  isoDaysAgo,
  isPartnerAuthError,
  partnerDirectionLabel,
  todayIso,
  type PartnerBooking,
} from "@/lib/partner";
import { Download } from "lucide-react";
import { friendlyErrorMessage } from "@/lib/goair";

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

/** Statuses that can't be cancelled again — mirrors the DB's own guard. */
function isCancellable(status: string) {
  const normalized = status.toLowerCase();
  return normalized !== "cancelled" && normalized !== "canceled";
}

function BookingsPage() {
  const token = usePartnerToken();
  const queryClient = useQueryClient();
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [applied, setApplied] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [cancelTarget, setCancelTarget] = useState<PartnerBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const query = useQuery({
    queryKey: ["partner-bookings", token, applied.from, applied.to],
    queryFn: () => getPartnerBookings(token, applied.from || null, applied.to || null),
    retry: false,
    enabled: Boolean(token),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBusinessBooking(token, cancelTarget!.id, cancelReason.trim() || null),
    onSuccess: (didCancel) => {
      if (!didCancel) {
        toast.error("الحجز ده مش تبع حسابك أو اتلغى بالفعل.");
        return;
      }
      toast.success("تم إلغاء الحجز.");
      setCancelTarget(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
    },
    onError: (error) => {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من إلغاء الحجز."));
    },
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

      {(query.data ?? []).length > 0 ? (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2 font-bold"
            onClick={() => exportPartnerBookingsCsv(query.data ?? [])}
          >
            <Download className="size-4" aria-hidden />
            تصدير كشف العملاء (CSV)
          </Button>
        </div>
      ) : null}

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
                <TableHead className="text-right">الاتجاه</TableHead>
                <TableHead className="text-right">الوجهة</TableHead>
                <TableHead className="text-right">عدد المقاعد</TableHead>
                <TableHead className="text-right">الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">مرحلة الرحلة</TableHead>
                <TableHead className="text-right">إجمالي الحجز</TableHead>
                <TableHead className="text-right">العمولة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground">{formatDate(row.bookedAt)}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {row.fullName}
                    {row.passengerNames.length > 1 ? (
                      <div className="mt-1 text-xs font-normal text-muted-foreground">
                        {row.passengerNames.join("، ")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">{row.phoneNumber}</TableCell>
                  <TableCell>{formatDate(row.travelDate)}</TableCell>
                  <TableCell>
                    {partnerDirectionLabel(row.direction)}
                    {row.roundTripGroupId ? (
                      <div className="mt-1 text-xs font-bold text-accent">🔁 ذهاب وعودة</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.origin} ← {row.destination}</TableCell>
                  <TableCell>{row.seatsCount}</TableCell>
                  <TableCell>{row.paymentStatus}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.status.toLowerCase() === "cancelled" || row.status.toLowerCase() === "canceled" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <LifecycleBadge status={row.lifecycleStatus} driverName={row.driverName} />
                    )}
                  </TableCell>
                  <TableCell>{formatPartnerMoney(row.expectedTotalUsd)}</TableCell>
                  <TableCell className="font-bold text-accent">{formatPartnerMoney(row.commissionUsd)}</TableCell>
                  <TableCell>
                    {isCancellable(row.status) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setCancelReason("");
                          setCancelTarget(row);
                        }}
                      >
                        إلغاء
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إلغاء الحجز</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `${cancelTarget.fullName} — ${cancelTarget.origin} ← ${cancelTarget.destination} — ${formatDate(cancelTarget.travelDate)}`
                : ""}
              {" — الإجراء ده نهائي."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">سبب الإلغاء (اختياري)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="اكتب سبب الإلغاء..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
              disabled={cancelMutation.isPending}
            >
              تراجع
            </Button>
            <Button
              className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerSection>
  );
}
