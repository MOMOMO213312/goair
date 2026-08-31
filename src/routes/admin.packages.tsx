import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreatePackage,
  adminDeletePackage,
  adminListPackages,
  adminUpdatePackage,
  isAdminAuthError,
  type AdminPackage,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/packages")({
  head: () => ({ meta: [{ title: "الباقات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: PackagesAdminPage,
});

const ICON_OPTIONS = ["Sparkles", "Clock", "Users", "Crown"];

function emptyForm() {
  return { name: "", tagline: "", priceUsd: "10", iconName: "Sparkles", featuresText: "", isHighlighted: false, sortOrder: "0" };
}

function PackagesAdminPage() {
  const { token } = Route.useSearch();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-packages", token], queryFn: () => adminListPackages(token), retry: false, enabled: Boolean(token) });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) return isAdminAuthError(q.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-packages", token] });

  function startEdit(pkg: AdminPackage) {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      tagline: pkg.tagline ?? "",
      priceUsd: String(pkg.priceUsd),
      iconName: pkg.iconName,
      featuresText: pkg.features.join("\n"),
      isHighlighted: pkg.isHighlighted,
      sortOrder: String(pkg.sortOrder),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("اكتب اسم الباقة."); return; }
    const features = form.featuresText.split("\n").map((f) => f.trim()).filter(Boolean);
    setBusy(true);
    try {
      if (editingId) {
        const existing = (q.data ?? []).find((p) => p.id === editingId);
        await adminUpdatePackage(token, {
          id: editingId,
          name: form.name.trim(),
          tagline: form.tagline.trim() || null,
          priceUsd: Number(form.priceUsd) || 0,
          iconName: form.iconName,
          features,
          isHighlighted: form.isHighlighted,
          isActive: existing?.isActive ?? true,
          sortOrder: Number(form.sortOrder) || 0,
        });
        toast.success("تم تحديث الباقة.");
      } else {
        await adminCreatePackage(token, {
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          priceUsd: Number(form.priceUsd) || 0,
          iconName: form.iconName,
          features,
          isHighlighted: form.isHighlighted,
          sortOrder: Number(form.sortOrder) || 0,
        });
        toast.success("تمت إضافة الباقة.");
      }
      resetForm();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(pkg: AdminPackage) {
    try {
      await adminUpdatePackage(token, { ...pkg, isActive: !pkg.isActive });
      refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
  }

  async function remove(id: string) {
    try { await adminDeletePackage(token, id); toast.success("تم الحذف."); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">{editingId ? "تعديل باقة" : "إضافة باقة جديدة"}</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input placeholder="اسم الباقة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="الوصف المختصر" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <Input type="number" placeholder="السعر بالدولار (لكل مسافر)" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
          <Select value={form.iconName} onValueChange={(v) => setForm({ ...form, iconName: v })}>
            <SelectTrigger><SelectValue placeholder="الأيقونة" /></SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="مميزات الباقة (كل ميزة في سطر)"
            value={form.featuresText}
            onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
            className="sm:col-span-2"
            rows={4}
          />
          <Input type="number" placeholder="ترتيب العرض" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={form.isHighlighted} onChange={(e) => setForm({ ...form, isHighlighted: e.target.checked })} />
            الأكثر طلبًا (تمييز بصري)
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              {editingId ? "حفظ التعديل" : "إضافة الباقة"}
            </Button>
            {editingId ? <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button> : null}
          </div>
        </form>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">الباقات الحالية</h2>
        <ul className="mt-4 space-y-3">
          {(q.data ?? []).map((pkg) => (
            <li key={pkg.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
              <div>
                <p className="font-bold text-primary">
                  {pkg.name} — ${pkg.priceUsd}
                  {!pkg.isActive ? <span className="mr-2 text-xs text-destructive">(متوقفة)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{pkg.tagline}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(pkg)}>تعديل</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(pkg)}>{pkg.isActive ? "إيقاف" : "تفعيل"}</Button>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => remove(pkg.id)}>حذف</Button>
              </div>
            </li>
          ))}
          {(q.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">مفيش باقات لسه.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
