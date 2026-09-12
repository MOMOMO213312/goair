import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  RentalProviderAuthError,
  RentalProviderLoading,
  RentalProviderStatCard,
} from "@/components/rental-provider/rental-provider-shell";
import { useRentalProviderToken } from "@/lib/rental-provider-session";
import {
  getRentalProviderProfile,
  isRentalProviderAuthError,
  listRentalProviderBookings,
  listRentalProviderVehicles,
} from "@/lib/rental-provider";

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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-extrabold text-primary">
          {profileQuery.data.companyName || profileQuery.data.fullName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profileQuery.data.providerType === "company" ? "حساب شركة تأجير" : "حساب مزوّد فردي"} ·{" "}
          {profileQuery.data.country}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RentalProviderStatCard label="عرباتك المعتمدة" value={String(approvedCount)} />
        <RentalProviderStatCard label="قيد المراجعة" value={String(pendingCount)} />
        <RentalProviderStatCard label="إجمالي عرباتك" value={String(vehicles.length)} />
        <RentalProviderStatCard label="حجوزات مستمرة" value={String(upcomingBookings)} />
      </div>
      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش عندك عربيات لسه.{" "}
          <Link to="/rental-provider/vehicles" className="font-bold text-primary underline">
            ضيف أول عربية
          </Link>{" "}
          — لازم موافقة GoAir الأول قبل ما تظهر للعملاء.
        </div>
      ) : null}
    </div>
  );
}
