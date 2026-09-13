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
  adminCreateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminListSubscriptionPlans,
  adminUpdateSubscriptionPlan,
  isAdminAuthError,
  type AdminSubscriptionPlan,
} from "@/lib/admin";
import { fetchPublicLaunchMarketCountries } from "@/lib/goair";

export const Route = createFileRoute("/admin/subscription-plans")({
  head: () => ({ meta: [{ title: "خطط الاشتراك — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: SubscriptionPlansAdminPage,
});

const ICON_OPTIONS = ["Sparkles", "Crown", "Zap", "ShieldCheck"];
const TIER_OPTIONS = ["basic", "plus", "premium"];
const DURATION_OPTIONS = ["semi_annual", "annual"];

function emptyForm() {
  return {
    country: "مصر",
    tier: "basic",
    duration: "semi_annual",
    name: "",
    tagline: "",
    priceUsd: "20",
    discountPercent: "10",
    freeRideCredits: "0",
    extraLuggagePieces: "0",
    prioritySupport: false,
    guaranteedSeat: false,
    iconName: "Sparkles",
    featuresText: "",
    isHighlighted: false,
    sortOrder: "0",
  };
}

function SubscriptionPlansAdminPage() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-subscription-plans", token],
    queryFn: () => adminListSubscriptionPlans(token),
    retry: false,
    enabled: Boolean(token),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);
  const countriesQuery = useQuery({
    queryKey: ["goair", "public-launch-market-countries"],
    queryFn: fetchPublicLaunchMarketCountries,
  });
  const countryOptions = countriesQuery.data ?? [];

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) return isAdminAuthError(q.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-subscription-plans", token] });

  function startEdit(plan: AdminSubscriptionPlan) {
    setEditingId(plan.id);
    setForm({
      country: plan.country,
      tier: plan.tier,
      duration: plan.duration,
      name: plan.name,
      tagline: plan.tagline ?? "",
      priceUsd: String(plan.priceUsd),
      discountPercent: String(plan.discountPercent),
      freeRideCredits: String(plan.freeRideCredits),
      extraLuggagePieces: String(plan.extraLuggagePieces),
      prioritySupport: plan.prioritySupport,
      guaranteedSeat: plan.guaranteedSeat,
      iconName: plan.iconName,
      featuresText: plan.features.join("\n"),
      isHighlighted: plan.isHighlighted,
      sortOrder: String(plan.sortOrder),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("اكتب اسم الخطة.");
      return;
    }
    const features = form.featuresText.split("\n").map((f) => f.trim()).filter(Boolean);
    const base = {
      country: form.country,
      tier: form.tier,
      duration: form.duration,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      priceUsd: Number(form.priceUsd) || 0,
      discountPercent: Number(form.discountPercent) || 0,
      freeRideCredits: Number(form.freeRideCredits) || 0,
      extraLuggagePieces: Number(form.extraLuggagePieces) || 0,
      prioritySupport: form.prioritySupport,
      guaranteedSeat: form.guaranteedSeat,
      iconName: form.iconName,
      features,
      isHighlighted: form.isHighlighted,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setBusy(true);
    try {
      if (editingId) {
        const existing = (q.data ?? []).find((p) => p.id === editingId);
        await adminUpdateSubscriptionPlan(token, {
          id: editingId,
          ...base,
          tagline: base.tagline || null,
          isActive: existing?.isActive ?? true,
        });
        toast.success("تم تحديث الخطة.");
      } else {
        await adminCreateSubscriptionPlan(token, base);
        toast.success("تمت إضافة الخطة.");
      }
      resetForm();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(plan: AdminSubscriptionPlan) {
    try {
      await adminUpdateSubscriptionPlan(token, { ...plan, isActive: !plan.isActive });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  async function remove(id: string) {
    try {
      await adminDeleteSubscriptionPlan(token, id);
      toast.success("تم الحذف.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">
          {editingId ? "تعديل خطة اشتراك" : "إضافة خطة اشتراك جديدة"}
        </h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input placeholder="اسم الخطة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="الوصف المختصر" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />

          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger><SelectValue placeholder="الدولة" /></SelectTrigger>
            <SelectContent>
              {countryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
            <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
            <SelectTrigger><SelectValue placeholder="المدة" /></SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d === "semi_annual" ? "نصف سنوي" : "سنوي"}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.iconName} onValueChange={(v) => setForm({ ...form, iconName: v })}>
            <SelectTrigger><SelectValue placeholder="الأيقونة" /></SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input type="number" placeholder="السعر بالدولار" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
          <Input type="number" placeholder="نسبة الخصم %" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
          <Input type="number" placeholder="عدد الرحلات المجانية" value={form.freeRideCredits} onChange={(e) => setForm({ ...form, freeRideCredits: e.target.value })} />
          <Input type="number" placeholder="قطع شنط إضافية" value={form.extraLuggagePieces} onChange={(e) => setForm({ ...form, extraLuggagePieces: e.target.value })} />

          <Textarea
            placeholder="مميزات الخطة (كل ميزة في سطر)"
            value={form.featuresText}
            onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
            className="sm:col-span-2"
            rows={4}
          />

          <Input type="number" placeholder="ترتيب العرض" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={form.prioritySupport} onChange={(e) => setForm({ ...form, prioritySupport: e.target.checked })} />
              دعم ذو أولوية
            </label>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={form.guaranteedSeat} onChange={(e) => setForm({ ...form, guaranteedSeat: e.target.checked })} />
              مقعد مضمون
            </label>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={form.isHighlighted} onChange={(e) => setForm({ ...form, isHighlighted: e.target.checked })} />
              الأكثر طلبًا (تمييز بصري)
            </label>
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              {editingId ? "حفظ التعديل" : "إضافة الخطة"}
            </Button>
            {editingId ? <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button> : null}
          </div>
        </form>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">الخطط الحالية</h2>
        <ul className="mt-4 space-y-3">
          {(q.data ?? []).map((plan) => (
            <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
              <div>
                <p className="font-bold text-primary">
                  {plan.name} ({plan.country}) — ${plan.priceUsd}
                  {!plan.isActive ? <span className="mr-2 text-xs text-destructive">(متوقفة)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>تعديل</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(plan)}>{plan.isActive ? "إيقاف" : "تفعيل"}</Button>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => remove(plan.id)}>حذف</Button>
              </div>
            </li>
          ))}
          {(q.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">مفيش خطط اشتراك لسه.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
