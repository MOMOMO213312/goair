import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Car, CarFront, Clock } from "lucide-react";

import { ListRow, PageHeader, PortalCard, StatCard, StatusPill, statusTone } from "@/components/portal/portal-ui";
import {
  RentalProviderAuthError,
  RentalProviderLoading,
} from "@/components/rental-provider/rental-provider-shell";
import { useRentalProviderToken } from "@/lib/rental-provider-session";
import {
  getRentalProviderProfile,
  isRentalProviderAuthError,
  listRentalProviderBookings,
  listRentalProviderVehicles,
  VERIFICATION_STATUS_LABELS,
} from "@/lib/rental-provider";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "معلّق",
  confirmed: "مؤكّد",
  in_progress: "جاري",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const Route = createFileRoute("/rental-provider/")({
  head: () => ({ meta: [{ title: "نظرة عامة — بوابة مزوّد التأجير" }, { name: "robots", content: "noindex" }] }),
  component: RentalProviderOverview,
});

function RentalProviderOverview() {
  const token = useRentalProviderToken();
  const profileQuery = useQuery({
    queryKey: ["rental-provider", "profile", token],
    queryFn: () => getRentalProviderProfile(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["rental-provider", "vehicles", token],
    queryFn: () => listRentalProviderVehicles(token),
    retry: false,
    enabled: Boolean(token),
  });
  const bookingsQuery = useQuery({
    queryKey: ["rental-provider", "bookings", token],
    queryFn: () => listRentalProviderBookings(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (profileQuery.isPending || vehiclesQuery.isPending || bookingsQuery.isPending) return <RentalProviderLoading />;
  if (profileQuery.isError || !profileQuery.data) {
    return isRentalProviderAuthError(profileQuery.error) ? (
      <RentalProviderAuthError />
    ) : (
      <RentalProviderAuthError message="حصل خطأ مؤقت." />
    );
  }

  const vehicles = vehiclesQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const approvedCount = vehicles.filter((v) => v.approvalStatus === "approved").length;
  const pendingCount = vehicles.filter((v) => v.approvalStatus === "pending_review").length;
  const upcomingBookings = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled").length;

  const verificationStatus = profileQuery.data.verificationStatus;

  const recentBookings = [...bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const name = profileQuery.data.companyName || profileQuery.data.fullName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`أهلاً، ${name}`}
        subtitle={`${profileQuery.data.providerType === "company" ? "حساب شركة تأجير" : "حساب مزوّد فردي"} · ${profileQuery.data.country}`}
        actions={
          <StatusPill tone={statusTone(verificationStatus === "pending_review" ? "pending" : verificationStatus)}>
            {VERIFICATION_STATUS_LABELS[verificationStatus]}
          </StatusPill>
        }
      />
      {verificationStatus === "pending_review" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          حسابك لسه بانتظار اعتماد فريق GoAir بعد مراجعة الأوراق. هتقدر تستقبل حجوزات لما يتم الاعتماد.
        </div>
      )}
      {verificationStatus === "rejected" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          للأسف تم رفض الحساب.
          {profileQuery.data.rejectionReason ? ` السبب: ${profileQuery.data.rejectionReason}` : ""} تواصل مع الدعم لمزيد
          من التفاصيل.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={CarFront} label="عرباتك المعتمدة" value={String(approvedCount)} />
        <StatCard icon={Clock} label="قيد المراجعة" value={String(pendingCount)} />
        <StatCard icon={Car} label="إجمالي عرباتك" value={String(vehicles.length)} />
        <StatCard highlight icon={CalendarCheck} label="حجوزات مستمرة" value={String(upcomingBookings)} />
      </div>
      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
          مفيش عندك عربيات لسه.{" "}
          <Link to="/rental-provider/vehicles" className="font-bold text-primary underline">
            ضيف أول عربية
          </Link>{" "}
          — لازم موافقة GoAir الأول قبل ما تظهر للعملاء.
        </div>
      ) : null}
      <PortalCard
        title="أحدث الحجوزات"
        action={
          <Link to="/rental-provider/bookings" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
            عرض الكل
          </Link>
        }
      >
        {recentBookings.length === 0 ? (
          <p className="text-sm text-slate-500">لسه مفيش حجوزات على عرباتك.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentBookings.map((booking) => (
              <ListRow
                key={booking.id}
                title={booking.vehicleMakeModel}
                subtitle={`${booking.customerName} · ${booking.pickupLocation}`}
                end={
                  <StatusPill tone={statusTone(booking.status)}>
                    {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                  </StatusPill>
                }
              />
            ))}
          </ul>
        )}
      </PortalCard>
    </div>
  );
}
