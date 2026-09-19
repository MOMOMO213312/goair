import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminToken } from "@/lib/admin-session";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminApproveTransportOperatorApplication,
  adminListTransportOperatorApplications,
  adminUpdateTransportOperatorApplicationStatus,
  isAdminAuthError,
  rentalApplicationStatusLabel,
  type TransportOperatorApplicationRow,
  type TransportPayoutTerms,
} from "@/lib/admin";
import { fetchVehicleTypes } from "@/lib/goair";

export const Route = createFileRoute("/admin/transport-applications")({
  head: () => ({
    meta: [
      { title: "طلبات النقل التشاركي — لوحة تشغيل GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransportApplicationsPage,
});

const QUERY_KEY = "admin-transport-applications";

function TransportApplicationsPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: [QUERY_KEY, token],
    queryFn: () => adminListTransportOperatorApplications(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehicleTypesQuery = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });

  if (!token) return null;
  if (applicationsQuery.isPending) return <AdminLoading />;
  if (applicationsQuery.isError) {
    return isAdminAuthError(applicationsQuery.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const applications = applicationsQuery.data ?? [];
  const typeLabels = new Map(
    (vehicleTypesQuery.data ?? []).map((v) => [v.id, `${v.labelAr} (${v.capacity} راكب)`]),
  );
  const openCount = applications.filter(
    (a) => a.status === "pending_review" || a.status === "contacted",
  ).length;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, token] });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-lg font-extrabold text-primary">
          طلبات النقل التشاركي — أصحاب العربيات ({openCount} مفتوح)
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          الموافقة بتنشئ حساب الشريك وبتربطه بحساب المتقدم تلقائيًا (بيدخل بنفس الإيميل وكلمة السر).
          الفرد بيتعمل له سواق وعربية، والشركة بتضيف أسطولها من بوابتها. أي سواق أو عربية بيفضلوا
          غير مفعّلين لحد ما تراجع مستنداتهم من صفحة «السائقين والعربيات». الموافقة (وتحديد شروط
          الدفع) للـ finance/super_admin بس.
        </p>
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
                vehicleTypeLabel={app.vehicleTypeId ? typeLabels.get(app.vehicleTypeId) : undefined}
                onDone={invalidate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function dateClass(value: string | null) {
  if (!value) return "";
  return value < new Date().toISOString().slice(0, 10) ? "font-bold text-destructive" : "";
}

function ApplicationCard({
  app,
  token,
  vehicleTypeLabel,
  onDone,
}: {
  app: TransportOperatorApplicationRow;
  token: string;
  vehicleTypeLabel: string | undefined;
  onDone: () => void;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState<TransportPayoutTerms["model"]>("fixed_per_trip");
  const [amount, setAmount] = useState("");

  const isOpen = app.status === "pending_review" || app.status === "contacted";

  async function setStatus(status: "contacted" | "rejected") {
    try {
      await adminUpdateTransportOperatorApplicationStatus(token, app.id, status);
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  async function approve() {
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value < 0) {
      toast.error("اكتب قيمة صحيحة لشروط الدفع.");
      return;
    }
    let payout: TransportPayoutTerms;
    if (model === "fixed_per_trip") {
      payout = { model, fixedAmountUsd: value };
    } else if (model === "per_seat") {
      payout = { model, perSeatAmountUsd: value };
    } else {
      if (value > 100) {
        toast.error("النسبة لازم تكون بين 0 و 100.");
        return;
      }
      payout = { model, percentageRate: value / 100 };
    }

    setBusy(true);
    try {
      await adminApproveTransportOperatorApplication(token, app.id, payout);
      toast.success(
        app.providerType === "company"
          ? "تم إنشاء حساب الشركة وربط دخولها. أي عربية تضيفها هتستنى مراجعتك قبل التفعيل."
          : "تم إنشاء حساب الشريك. راجع مستندات السواق والعربية من «السائقين والعربيات» لتفعيلهم.",
      );
      setApproveOpen(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  const amountLabel =
    model === "fixed_per_trip"
      ? "المبلغ الثابت للرحلة (USD)"
      : model === "per_seat"
        ? "مبلغ المقعد (USD)"
        : "النسبة من التذكرة (%)";

  return (
    <Card className="space-y-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-primary">
            {app.providerType === "company" && app.companyName ? `${app.companyName} — ` : ""}
            {app.fullName} — <span dir="ltr">{app.phoneNumber}</span>
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="rounded-full bg-muted px-2 py-0.5 text-primary">
              {app.providerType === "company" ? "شركة نقل" : "فرد صاحب عربية"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 ${app.accountLinked ? "bg-accent/15 text-accent" : "bg-destructive/10 text-destructive"}`}
            >
              {app.accountLinked ? "له حساب دخول (هيتربط تلقائيًا)" : "من غير حساب دخول"}
            </span>
          </p>
          {app.providerType === "company" ? (
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              <p>
                {app.country}
                {app.city ? ` · ${app.city}` : ""}
                {app.fleetSize ? ` · أسطول تقريبي: ${app.fleetSize} عربية` : ""}
              </p>
              <p>
                سجل تجاري: <span dir="ltr">{app.commercialRegistrationNumber ?? "—"}</span>
                {app.taxNumber ? (
                  <>
                    {" · "}ضريبي: <span dir="ltr">{app.taxNumber}</span>
                  </>
                ) : null}
              </p>
              {app.email ? (
                <p dir="ltr" className="text-start text-xs">
                  {app.email}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {app.country}
                {app.city ? ` · ${app.city}` : ""}
                {vehicleTypeLabel ? ` · ${vehicleTypeLabel}` : ""}
                {app.carMakeModel ? ` · ${app.carMakeModel}` : ""}
                {app.carYear ? ` (${app.carYear})` : ""}
              </p>
              <p className="mt-0.5 text-sm text-primary">
                لوحة: <span dir="ltr">{app.plateNumber ?? "—"}</span>
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                <p>
                  رخصة العربية تنتهي:{" "}
                  <span className={dateClass(app.registrationExpiry)}>
                    {app.registrationExpiry ?? "—"}
                  </span>
                  {" · "}التأمين ينتهي:{" "}
                  <span className={dateClass(app.insuranceExpiry)}>
                    {app.insuranceExpiry ?? "—"}
                  </span>
                </p>
                <p>
                  {app.hasDriverLicense ? (
                    <>
                      صاحب العربية هو السواق — رخصة{" "}
                      <span dir="ltr">{app.licenseNumber ?? "—"}</span> تنتهي:{" "}
                      <span className={dateClass(app.licenseExpiry)}>
                        {app.licenseExpiry ?? "—"}
                      </span>
                    </>
                  ) : (
                    "مش هيسوق بنفسه — لازم يتحدد سواق بعد الموافقة"
                  )}
                </p>
                {app.nationalIdNumber ? (
                  <p>
                    هوية: <span dir="ltr">{app.nationalIdNumber}</span>
                  </p>
                ) : null}
                {app.email ? (
                  <p dir="ltr" className="text-start">
                    {app.email}
                  </p>
                ) : null}
              </div>
            </>
          )}
          {app.notes ? <p className="mt-1 text-sm text-primary">{app.notes}</p> : null}
          {app.adminNotes ? (
            <p className="mt-1 text-xs text-muted-foreground">ملاحظة داخلية: {app.adminNotes}</p>
          ) : null}
          <p className="mt-1 text-xs font-bold text-accent">
            {rentalApplicationStatusLabel(app.status)}
          </p>
        </div>

        {isOpen ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {app.status === "pending_review" ? (
              <Button size="sm" variant="outline" onClick={() => setStatus("contacted")}>
                تم التواصل
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setStatus("rejected")}>
              رفض
            </Button>
            <Button
              size="sm"
              onClick={() => setApproveOpen((v) => !v)}
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              موافقة…
            </Button>
          </div>
        ) : null}
      </div>

      {isOpen && approveOpen ? (
        <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>نموذج دفع الشريك</Label>
            <Select
              value={model}
              onValueChange={(v) => {
                setModel(v as TransportPayoutTerms["model"]);
                setAmount("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_per_trip">مبلغ ثابت لكل رحلة</SelectItem>
                <SelectItem value="per_seat">مبلغ لكل مقعد</SelectItem>
                <SelectItem value="percentage_of_ticket">نسبة من التذكرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`amt-${app.id}`}>{amountLabel}</Label>
            <Input
              id={`amt-${app.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            disabled={busy}
            onClick={approve}
            className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "جاري الموافقة..." : "تأكيد الموافقة"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
