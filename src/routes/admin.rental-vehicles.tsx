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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  adminAddRentalVehicle,
  adminListRentalVehicles,
  adminUpdateRentalVehicle,
  isAdminAuthError,
  rentalVehicleApprovalLabel,
  type AdminRentalVehicle,
} from "@/lib/admin";
import { fetchRentalVehicleCategories } from "@/lib/goair";

export const Route = createFileRoute("/admin/rental-vehicles")({
  head: () => ({
    meta: [{ title: "عربيات تأجير السيارات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: RentalVehiclesAdminPage,
});

const COUNTRIES: string[] = ["مصر", "لبنان"];

function emptyNewVehicleForm() {
  return {
    partnerFullName: "",
    partnerPhone: "",
    partnerCountry: COUNTRIES[0] ?? "مصر",
    categoryId: "",
    plateNumber: "",
    makeModel: "",
    description: "",
    hourlyRate: "",
    dailyRate: "",
    multiDayRate: "",
  };
}

function RentalVehiclesAdminPage() {
  const token = useAdminToken();
  const qc = useQueryClient();

  const vehiclesQuery = useQuery({
    queryKey: ["admin-rental-vehicles", token],
    queryFn: () => adminListRentalVehicles(token),
    retry: false,
    enabled: Boolean(token),
  });
  const categoriesQuery = useQuery({
    queryKey: ["goair", "rental-vehicle-categories"],
    queryFn: fetchRentalVehicleCategories,
  });

  const [newForm, setNewForm] = useState(emptyNewVehicleForm());
  const [addBusy, setAddBusy] = useState(false);

  if (!token) return null;
  if (vehiclesQuery.isPending) return <AdminLoading />;
  if (vehiclesQuery.isError) {
    return isAdminAuthError(vehiclesQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const vehicles = vehiclesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-rental-vehicles", token] });
  }

  async function submitNewVehicle(event: React.FormEvent) {
    event.preventDefault();
    if (!newForm.partnerFullName.trim() || !newForm.partnerPhone.trim() || !newForm.plateNumber.trim() || !newForm.dailyRate.trim()) {
      toast.error("اسم صاحب العربية، التليفون، رقم اللوحة، والسعر اليومي مطلوبين.");
      return;
    }
    setAddBusy(true);
    try {
      await adminAddRentalVehicle(token, {
        partnerFullName: newForm.partnerFullName.trim(),
        partnerPhone: newForm.partnerPhone.trim(),
        partnerCountry: newForm.partnerCountry,
        categoryId: newForm.categoryId || null,
        plateNumber: newForm.plateNumber.trim(),
        makeModel: newForm.makeModel.trim(),
        description: newForm.description.trim() || null,
        hourlyRateUsd: newForm.hourlyRate.trim() ? Number(newForm.hourlyRate) : null,
        dailyRateUsd: Number(newForm.dailyRate),
        multiDayRateUsd: newForm.multiDayRate.trim() ? Number(newForm.multiDayRate) : null,
        multiDayThresholdDays: 3,
        minRentalHours: 3,
      });
      toast.success("تمت إضافة العربية.");
      setNewForm(emptyNewVehicleForm());
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">إضافة عربية يدويًا</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          للحالات اللي مش جاية من فورم "أجّر عربيتك" — بتتضاف كـ "معتمدة" فورًا.
        </p>
        <form onSubmit={submitNewVehicle} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="اسم صاحب العربية"
            value={newForm.partnerFullName}
            onChange={(e) => setNewForm({ ...newForm, partnerFullName: e.target.value })}
          />
          <Input
            placeholder="رقم التليفون"
            value={newForm.partnerPhone}
            onChange={(e) => setNewForm({ ...newForm, partnerPhone: e.target.value })}
          />
          <Select value={newForm.partnerCountry} onValueChange={(v) => setNewForm({ ...newForm, partnerCountry: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newForm.categoryId} onValueChange={(v) => setNewForm({ ...newForm, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="فئة العربية" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.label_ar}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="رقم اللوحة"
            value={newForm.plateNumber}
            onChange={(e) => setNewForm({ ...newForm, plateNumber: e.target.value })}
          />
          <Input
            placeholder="موديل العربية"
            value={newForm.makeModel}
            onChange={(e) => setNewForm({ ...newForm, makeModel: e.target.value })}
          />
          <Input
            type="number"
            placeholder="سعر الساعة (اختياري)"
            value={newForm.hourlyRate}
            onChange={(e) => setNewForm({ ...newForm, hourlyRate: e.target.value })}
          />
          <Input
            type="number"
            placeholder="سعر اليوم *"
            value={newForm.dailyRate}
            onChange={(e) => setNewForm({ ...newForm, dailyRate: e.target.value })}
          />
          <Input
            type="number"
            placeholder="سعر لعدة أيام (اختياري)"
            value={newForm.multiDayRate}
            onChange={(e) => setNewForm({ ...newForm, multiDayRate: e.target.value })}
          />
          <Textarea
            placeholder="وصف العربية (اختياري)"
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            className="sm:col-span-2"
            rows={3}
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={addBusy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              {addBusy ? "جاري الإضافة..." : "إضافة العربية"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">العربيات الحالية ({vehicles.length})</h2>
        <div className="mt-4 space-y-3">
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش عربيات لسه.</p>
          ) : (
            vehicles.map((vehicle) => (
              <VehicleRow
                key={vehicle.id}
                vehicle={vehicle}
                token={token}
                categories={categories}
                onDone={invalidate}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function VehicleRow({
  vehicle,
  token,
  categories,
  onDone,
}: {
  vehicle: AdminRentalVehicle;
  token: string;
  categories: { id: string; label_ar: string }[];
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    categoryId: vehicle.categoryId ?? "",
    plateNumber: vehicle.plateNumber,
    makeModel: vehicle.makeModel,
    description: vehicle.description ?? "",
    hourlyRate: vehicle.hourlyRateUsd == null ? "" : String(vehicle.hourlyRateUsd),
    dailyRate: String(vehicle.dailyRateUsd),
    multiDayRate: vehicle.multiDayRateUsd == null ? "" : String(vehicle.multiDayRateUsd),
    approvalStatus: vehicle.approvalStatus,
    adminNotes: vehicle.adminNotes ?? "",
    isActive: vehicle.isActive,
  }));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateRentalVehicle(token, {
        id: vehicle.id,
        categoryId: form.categoryId || null,
        plateNumber: form.plateNumber.trim(),
        makeModel: form.makeModel.trim(),
        description: form.description.trim() || null,
        hourlyRateUsd: form.hourlyRate.trim() ? Number(form.hourlyRate) : null,
        dailyRateUsd: Number(form.dailyRate) || 0,
        multiDayRateUsd: form.multiDayRate.trim() ? Number(form.multiDayRate) : null,
        multiDayThresholdDays: vehicle.multiDayThresholdDays,
        minRentalHours: vehicle.minRentalHours,
        approvalStatus: form.approvalStatus,
        adminNotes: form.adminNotes.trim() || null,
        isActive: form.isActive,
      });
      toast.success("تم الحفظ.");
      setEditing(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function quickSetStatus(status: string) {
    setBusy(true);
    try {
      await adminUpdateRentalVehicle(token, {
        id: vehicle.id,
        categoryId: vehicle.categoryId,
        plateNumber: vehicle.plateNumber,
        makeModel: vehicle.makeModel,
        description: vehicle.description,
        hourlyRateUsd: vehicle.hourlyRateUsd,
        dailyRateUsd: vehicle.dailyRateUsd,
        multiDayRateUsd: vehicle.multiDayRateUsd,
        multiDayThresholdDays: vehicle.multiDayThresholdDays,
        minRentalHours: vehicle.minRentalHours,
        approvalStatus: status,
        adminNotes: vehicle.adminNotes,
        isActive: vehicle.isActive,
      });
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold text-primary">
            {vehicle.makeModel} — {vehicle.plateNumber}
            {!vehicle.isActive ? <span className="mr-2 text-xs text-destructive">(متوقفة)</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {vehicle.partnerName} · {vehicle.partnerPhone} · {vehicle.country}
            {vehicle.categoryLabelAr ? ` · ${vehicle.categoryLabelAr}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            ${vehicle.dailyRateUsd}/يوم
            {vehicle.hourlyRateUsd != null ? ` · $${vehicle.hourlyRateUsd}/ساعة` : ""}
            {vehicle.multiDayRateUsd != null ? ` · $${vehicle.multiDayRateUsd}/عدة أيام` : ""}
          </p>
          <p className="mt-0.5 text-xs font-bold text-accent">{rentalVehicleApprovalLabel(vehicle.approvalStatus)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {vehicle.approvalStatus !== "approved" ? (
            <Button size="sm" disabled={busy} onClick={() => quickSetStatus("approved")} className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
              اعتماد
            </Button>
          ) : null}
          {vehicle.approvalStatus !== "rejected" ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => quickSetStatus("rejected")}>
              رفض
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>تعديل</Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-lg border-primary/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>رقم اللوحة</Label>
          <Input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>موديل العربية</Label>
          <Input value={form.makeModel} onChange={(e) => setForm({ ...form, makeModel: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>الفئة</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.label_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>حالة الموافقة</Label>
          <Select value={form.approvalStatus} onValueChange={(v) => setForm({ ...form, approvalStatus: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_review">قيد المراجعة</SelectItem>
              <SelectItem value="approved">معتمدة</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>سعر الساعة</Label>
          <Input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>سعر اليوم</Label>
          <Input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>سعر لعدة أيام</Label>
          <Input type="number" value={form.multiDayRate} onChange={(e) => setForm({ ...form, multiDayRate: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id={`active-${vehicle.id}`}
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <Label htmlFor={`active-${vehicle.id}`} className="cursor-pointer">مفعّلة وظاهرة للعملاء</Label>
        </div>
        <Textarea
          placeholder="وصف العربية"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="sm:col-span-2"
          rows={2}
        />
        <Textarea
          placeholder="ملاحظات إدارية (داخلية فقط)"
          value={form.adminNotes}
          onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
          className="sm:col-span-2"
          rows={2}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={busy} onClick={save} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          {busy ? "جاري الحفظ..." : "حفظ"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>إلغاء</Button>
      </div>
    </Card>
  );
}
