import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminToken } from "@/lib/admin-session";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [approveOpen, setApproveOpen] = useState(false);

  async function setStatus(status: string) {
    try {
      await adminUpdateRentalPartnerApplicationStatus(token, app.id, status);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
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
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                  موافقة وإنشاء عربية
                </Button>
              </DialogTrigger>
              <ApproveDialogContent app={app} token={token} onDone={() => { setApproveOpen(false); onDone(); }} />
            </Dialog>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function ApproveDialogContent({
  app,
  token,
  onDone,
}: {
  app: RentalPartnerApplicationRow;
  token: string;
  onDone: () => void;
}) {
  const [plateNumber, setPlateNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [multiDayRate, setMultiDayRate] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!plateNumber.trim() || !dailyRate.trim()) {
      toast.error("رقم اللوحة والسعر اليومي مطلوبين.");
      return;
    }
    setBusy(true);
    try {
      await adminApproveRentalPartnerApplication(token, {
        applicationId: app.id,
        plateNumber: plateNumber.trim(),
        hourlyRateUsd: hourlyRate.trim() ? Number(hourlyRate) : null,
        dailyRateUsd: Number(dailyRate),
        multiDayRateUsd: multiDayRate.trim() ? Number(multiDayRate) : null,
        multiDayThresholdDays: 3,
        minRentalHours: 3,
        description: description.trim() || null,
      });
      toast.success("تم إنشاء العربية والموافقة على الطلب.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>موافقة على طلب {app.fullName}</DialogTitle>
        <DialogDescription>
          هيتعمل حساب شريك (لو مفيش واحد بنفس رقم التليفون) وعربية جاهزة للظهور للعملاء فورًا.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plate">رقم اللوحة</Label>
          <Input id="plate" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="hourly">سعر الساعة (اختياري)</Label>
            <Input id="hourly" inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily">سعر اليوم *</Label>
            <Input id="daily" inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiday">سعر لعدة أيام (اختياري)</Label>
            <Input id="multiday" inputMode="decimal" value={multiDayRate} onChange={(e) => setMultiDayRate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">وصف العربية (اختياري)</Label>
          <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? "جاري الحفظ..." : "تأكيد الموافقة"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
