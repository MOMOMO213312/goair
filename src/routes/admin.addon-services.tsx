import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAdminToken } from "@/lib/admin-session";
import { useState } from "react";
import { toast } from "sonner";
import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  adminDeleteAddonService,
  adminListAddonServices,
  adminUpdateAddonService,
  isAdminAuthError,
  type AdminAddonService,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/addon-services")({
  head: () => ({ meta: [{ title: "الخدمات الإضافية — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: AddonServicesAdminPage,
});

const ICON_OPTIONS = ["Sparkles", "Luggage", "UserRound", "ShieldCheck", "Clock", "Wifi"];
const CATEGORY_OPTIONS = [
  { value: "before_trip", label: "قبل الرحلة" },
  { value: "luggage", label: "الشنط" },
  { value: "airport", label: "المطار" },
  { value: "destination", label: "الوجهة" },
];

function emptyForm() {
  return {
    nameAr: "",
    descriptionAr: "",
    category: "before_trip",
    priceUsd: "5",
    iconName: "Sparkles",
    isHighlighted: false,
    sortOrder: "0",
  };
}

function AddonServicesAdminPage() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-addon-services", token],
    queryFn: () => adminListAddonServices(token),
    retry: false,
    enabled: Boolean(token),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) return isAdminAuthError(q.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-addon-services", token] });

  function startEdit(addon: AdminAddonService) {
    setEditingId(addon.id);
    setForm({
      nameAr: addon.nameAr,
      descriptionAr: addon.descriptionAr ?? "",
      category: addon.category,
      priceUsd: String(addon.priceUsd),
      iconName: addon.iconName,
      isHighlighted: addon.isHighlighted,
      sortOrder: String(addon.sortOrder),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nameAr.trim()) {
      toast.error("اكتب اسم الخدمة.");
      return;
    }
    if (!editingId) return;
    setBusy(true);
    try {
      const existing = (q.data ?? []).find((a) => a.id === editingId);
      await adminUpdateAddonService(token, {
        id: editingId,
        nameAr: form.nameAr.trim(),
        descriptionAr: form.descriptionAr.trim() || null,
        category: form.category,
        priceUsd: Number(form.priceUsd) || 0,
        iconName: form.iconName,
        isHighlighted: form.isHighlighted,
        isActive: existing?.isActive ?? true,
        sortOrder: Number(form.sortOrder) || 0,
        ownerType: existing?.ownerType ?? "goair",
      });
      toast.success("تم تحديث الخدمة.");
      resetForm();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(addon: AdminAddonService) {
    try {
      await adminUpdateAddonService(token, { ...addon, isActive: !addon.isActive });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  async function remove(id: string) {
    try {
      await adminDeleteAddonService(token, id);
      toast.success("تم الحذف.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  const all = q.data ?? [];
  const goairOwned = all.filter((a) => a.ownerType === "goair");
  const transitional = all.filter((a) => a.ownerType !== "goair");

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">خدمات GoAir</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          GoAir بتتحكم بس في التأمين وeSIM. باقي الخدمات الإضافية بتتبع شركة الطيران وشركتها الأرضية.
        </p>

        {editingId ? (
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input placeholder="اسم الخدمة" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <Input type="number" placeholder="السعر بالدولار" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.iconName} onValueChange={(v) => setForm({ ...form, iconName: v })}>
              <SelectTrigger><SelectValue placeholder="الأيقونة" /></SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="وصف الخدمة"
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              className="sm:col-span-2"
              rows={3}
            />
            <Input type="number" placeholder="ترتيب العرض" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={form.isHighlighted} onChange={(e) => setForm({ ...form, isHighlighted: e.target.checked })} />
              مميزة (تمييز بصري)
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
                حفظ التعديل
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
            </div>
          </form>
        ) : null}

        <ul className="mt-4 space-y-3">
          {goairOwned.map((addon) => (
            <li key={addon.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
              <div>
                <p className="font-bold text-primary">
                  {addon.nameAr} — ${addon.priceUsd}
                  {!addon.isActive ? <span className="mr-2 text-xs text-destructive">(متوقفة)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{addon.descriptionAr}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(addon)}>تعديل</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(addon)}>{addon.isActive ? "إيقاف" : "تفعيل"}</Button>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => remove(addon.id)}>حذف</Button>
              </div>
            </li>
          ))}
          {goairOwned.length === 0 ? <p className="text-sm text-muted-foreground">مفيش خدمات GoAir لسه.</p> : null}
        </ul>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">خدمات مؤقتة (تتبع شركة الطيران / الأرضية)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          فضلت ظاهرة للعميل بأسعارها الحالية لحد ما شركة الطيران أو شركتها الأرضية تدخل خدماتها من بوابتها. هنا تقدر توقف أو تفعّل بس، من غير تعديل اسم أو سعر.
        </p>
        <ul className="mt-4 space-y-3">
          {transitional.map((addon) => (
            <li key={addon.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
              <div>
                <p className="font-bold text-primary">
                  {addon.nameAr} — ${addon.priceUsd}
                  {!addon.isActive ? <span className="mr-2 text-xs text-destructive">(متوقفة)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{addon.descriptionAr}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleActive(addon)}>{addon.isActive ? "إيقاف" : "تفعيل"}</Button>
            </li>
          ))}
          {transitional.length === 0 ? <p className="text-sm text-muted-foreground">مفيش خدمات مؤقتة.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
