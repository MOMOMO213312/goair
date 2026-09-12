import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminToken } from "@/lib/admin-session";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminApproveRentalPartnerApplication,
  adminListRentalPartnerApplications,
  adminUpdateRentalPartnerApplicationStatus,
  isAdminAuthError,
  rentalApplicationStatusLabel,
  type RentalPartnerApplicationRow,
} from "@/lib/admin";
import { fetchRentalVehicleCategories } from "@/lib/goair";

export const Route = createFileRoute("/admin/rental-applications")({
  head: () => ({
    meta: [{ title: "طلبات تأجير السيارات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: RentalApplicationsPage,
});

function RentalApplicationsPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ["admin-rental-applications", token],
    queryFn: () => adminListRentalPartnerApplications(token),
    retry: false,
    enabled: Boolean(token),
  });
  const categoriesQuery = useQuery({
    queryKey: ["goair", "rental-vehicle-categories"],
    queryFn: fetchRentalVehicleCategories,
  });

  if (!token) return null;
  if (applicationsQuery.isPending) return <AdminLoading />;
  if (applicationsQuery.isError) {
    return isAdminAuthError(applicationsQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const applications = applicationsQuery.data ?? [];
  const categoryLabels = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.label_ar]));
  const openCount = applications.filter((a) => a.status === "pending_review" || a.status === "contacted").length;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-rental-applications", token] });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-display text-lg font-extrabold text-primary">
          طلبات تأجير السيارات ({openCount} مفتوح)
        </h2>
        {applications.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            مفيش طلبات لسه.
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                token={token}
                categoryLabel={app.categoryId ? categoryLabels.get(app.categoryId) : undefined}
                onDone={invalidate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ApplicationCard({
  app,
  token,
  categoryLabel,
  onDone,
}: {
  app: RentalPartnerApplicationRow;
  token: string;
  categoryLabel: string | undefined;
  onDone: () => void;
}) {
  const [approving, setApproving] = useState(false);

  async function setStatus(status: string) {
    try {
      await adminUpdateRentalPartnerApplicationStatus(token, app.id, status);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  async function approve() {
    setApproving(true);
    try {
      await adminApproveRentalPartnerApplication(token, app.id);
      toast.success("تم إنشاء حساب المزوّد. هيقدر يدخل لوحته ويضيف عرباته بنفسه.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {app.fullName} — {app.phoneNumber}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {app.country}
          {app.city ? ` · ${app.city}` : ""} · {app.carMakeModel}
          {app.carYear ? ` (${app.carYear})` : ""}
          {categoryLabel ? ` · ${categoryLabel}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {app.hasDriverLicense ? "معاه رخصة قيادة" : "بدون رخصة قيادة"}
          {app.email ? ` · ${app.email}` : ""}
        </p>
        {app.notes ? <p className="mt-1 text-sm text-primary">{app.notes}</p> : null}
        <p className="mt-1 text-xs font-bold text-accent">{rentalApplicationStatusLabel(app.status)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {app.status === "pending_review" ? (
          <Button size="sm" variant="outline" onClick={() => setStatus("contacted")}>
            تم التواصل
          </Button>
        ) : null}
        {app.status !== "approved" && app.status !== "rejected" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus("rejected")}>
              رفض
            </Button>
            <Button
              size="sm"
              disabled={approving}
              onClick={approve}
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {approving ? "جاري الموافقة..." : "موافقة — إنشاء حساب المزوّد"}
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
