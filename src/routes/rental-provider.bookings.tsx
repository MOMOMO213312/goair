import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  RentalProviderAuthError,
  RentalProviderLoading,
  RentalProviderSection,
} from "@/components/rental-provider/rental-provider-shell";
import { Card } from "@/components/ui/card";
import { useRentalProviderToken } from "@/lib/rental-provider-session";
import { isRentalProviderAuthError, listRentalProviderBookings } from "@/lib/rental-provider";

export const Route = createFileRoute("/rental-provider/bookings")({
  head: () => ({ meta: [{ title: "الحجوزات — بوابة مزوّد التأجير" }, { name: "robots", content: "noindex" }] }),
  component: RentalProviderBookingsPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "معلّق",
  confirmed: "مؤكّد",
  in_progress: "جاري",
  completed: "مكتمل",
  cancelled: "ملغي",
};

function RentalProviderBookingsPage() {
  const token = useRentalProviderToken();
  const bookingsQuery = useQuery({
    queryKey: ["rental-provider", "bookings", token],
    queryFn: () => listRentalProviderBookings(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (bookingsQuery.isPending) return <RentalProviderLoading />;
  if (bookingsQuery.isError) {
    return isRentalProviderAuthError(bookingsQuery.error) ? (
      <RentalProviderAuthError />
    ) : (
      <RentalProviderAuthError message="حصل خطأ مؤقت." />
    );
  }

  const bookings = bookingsQuery.data ?? [];

  return (
    <RentalProviderSection title="الحجوزات" description="كل الحجوزات على عرباتك.">
      {bookings.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">مفيش حجوزات لسه.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-base font-bold text-primary">{b.vehicleMakeModel}</p>
                <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-bold text-primary">
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.customerName} · {b.customerPhone}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(b.startDatetime).toLocaleString("ar-EG")} →{" "}
                {new Date(b.endDatetime).toLocaleString("ar-EG")}
              </p>
              {b.pickupLocation ? (
                <p className="mt-1 text-sm text-muted-foreground">الاستلام: {b.pickupLocation}</p>
              ) : null}
              <p className="mt-2 font-bold text-primary">{b.totalUsd}$</p>
            </Card>
          ))}
        </div>
      )}
    </RentalProviderSection>
  );
}
