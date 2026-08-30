import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminAssignTrip,
  adminConfirmPayment,
  adminListBookings,
  adminListDrivers,
  adminListVehicles,
  adminRejectPayment,
  bookingStatusLabel,
  formatAdminMoney,
  isAdminAuthError,
  paymentMethodLabel,
  reviewStatusLabel,
  type AdminBookingRow,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "الحجوزات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: AdminBookingsPage,
});

function AdminBookingsPage() {
  const { token } = Route.useSearch();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings", token],
    queryFn: () => adminListBookings(token),
    retry: false,
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
  const driversQuery = useQuery({
    queryKey: ["admin-drivers", token],
    queryFn: () => adminListDrivers(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["admin-vehicles", token],
    queryFn: () => adminListVehicles(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (bookingsQuery.isPending) return <AdminLoading />;
  if (bookingsQuery.isError) {
    return isAdminAuthError(bookingsQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const bookings = bookingsQuery.data ?? [];
  const needsPayment = bookings.filter((b) => b.status === "pending");
  const needsAssignment = bookings.filter((b) => b.status === "confirmed" && !b.tripAssignmentId);
  const rest = bookings.filter((b) => b.status !== "pending" && (b.status !== "confirmed" || b.tripAssignmentId));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-bookings", token] });

  return (
    <div className="space-y-8">
      <Section title={`بانتظار مراجعة الدفع (${needsPayment.length})`}>
        {needsPayment.length === 0 ? (
          <Empty text="مفيش حجوزات بانتظار مراجعة الدفع دلوقتي." />
        ) : (
          needsPayment.map((booking) => (
            <PaymentCard key={booking.bookingId} booking={booking} token={token} onDone={refresh} />
          ))
        )}
      </Section>

      <Section title={`مؤكدة ومحتاجة تخصيص سائق/عربية (${needsAssignment.length})`}>
        {needsAssignment.length === 0 ? (
          <Empty text="مفيش حجوزات محتاجة تخصيص دلوقتي." />
        ) : (
          needsAssignment.map((booking) => (
            <AssignCard
              key={booking.bookingId}
              booking={booking}
              token={token}
              drivers={driversQuery.data ?? []}
              vehicles={vehiclesQuery.data ?? []}
              onDone={refresh}
            />
          ))
        )}
      </Section>

      <Section title={`باقي الحجوزات (${rest.length})`}>
        {rest.length === 0 ? (
          <Empty text="مفيش حجوزات تانية." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-right text-xs font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">التذكرة</th>
                  <th className="px-4 py-3">الراكب</th>
                  <th className="px-4 py-3">الرحلة</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">السائق/العربية</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((b) => (
                  <tr key={b.bookingId} className="border-t border-border/60">
                    <td className="px-4 py-3 font-semibold text-primary">{b.ticketCode}</td>
                    <td className="px-4 py-3">{b.fullName}</td>
                    <td className="px-4 py-3">
                      {b.origin} ← {b.destination}
                    </td>
                    <td className="px-4 py-3">{b.travelDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.driverName ? `${b.driverName} — ${b.vehiclePlate}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-extrabold text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-accent/15 text-primary",
    confirmed: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", map[status] ?? "bg-muted")}>
      {bookingStatusLabel(status)}
    </span>
  );
}

function PaymentCard({
  booking,
  token,
  onDone,
}: {
  booking: AdminBookingRow;
  token: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!booking.paymentId) {
      toast.error("مفيش دفعة مسجلة على الحجز ده لسه.");
      return;
    }
    setBusy(true);
    try {
      await adminConfirmPayment(token, booking.paymentId);
      toast.success("تم تأكيد الدفع والحجز.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!booking.paymentId) return;
    setBusy(true);
    try {
      await adminRejectPayment(token, booking.paymentId);
      toast.success("تم رفض الدفعة.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {booking.ticketCode} — {booking.fullName}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {booking.origin} ← {booking.destination} · {booking.travelDate} · {booking.seatsCount} راكب
        </p>
        <p className="mt-1 text-sm">
          {booking.paymentId ? (
            <>
              <span className="font-bold text-primary">{paymentMethodLabel(booking.paymentMethod)}</span> —{" "}
              {formatAdminMoney(booking.paymentAmountUsd)}
              {booking.paymentReference ? ` — مرجع: ${booking.paymentReference}` : ""}
              {" — "}
              <span className="text-muted-foreground">{reviewStatusLabel(booking.paymentReviewStatus)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">لسه العميل ما دفعش</span>
          )}
        </p>
        {booking.paymentProofUrl ? (
          <a
            href={booking.paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            شوف إثبات الدفع
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          disabled={busy || !booking.paymentId}
          onClick={confirm}
          className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Check className="size-4" aria-hidden />
          تأكيد
        </Button>
        <Button size="sm" variant="outline" disabled={busy || !booking.paymentId} onClick={reject}>
          <X className="size-4" aria-hidden />
          رفض
        </Button>
      </div>
    </Card>
  );
}

function AssignCard({
  booking,
  token,
  drivers,
  vehicles,
  onDone,
}: {
  booking: AdminBookingRow;
  token: string;
  drivers: { id: string; full_name: string }[];
  vehicles: { id: string; plate_number: string; vehicle_label: string; capacity: number }[];
  onDone: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [busy, setBusy] = useState(false);

  async function assign() {
    if (!booking.scheduleId) {
      toast.error("الحجز ده مالوش موعد ثابت مرتبط بيه — محتاج مراجعة يدوية.");
      return;
    }
    if (!driverId || !vehicleId) {
      toast.error("اختار السائق والعربية الأول.");
      return;
    }
    setBusy(true);
    try {
      await adminAssignTrip(token, booking.scheduleId, booking.travelDate, vehicleId, driverId);
      toast.success("تم التخصيص.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {booking.ticketCode} — {booking.fullName}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {booking.origin} ← {booking.destination} · {booking.travelDate} · {booking.seatsCount} راكب
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="العربية" /></SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.plate_number} — {v.vehicle_label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="السائق" /></SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={busy} onClick={assign} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          تخصيص
        </Button>
      </div>
    </Card>
  );
}
