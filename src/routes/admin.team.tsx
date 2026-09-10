import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminToken } from "@/lib/admin-session";
import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminCreateStaffAccount,
  adminDeactivateStaffAccount,
  adminListStaffAccounts,
  adminSetStaffPassword,
  isAdminAuthError,
  type AdminStaffAccount,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/team")({
  head: () => ({ meta: [{ title: "فريق العمل — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: TeamAdminPage,
});

function emptyForm() {
  return { fullName: "", email: "", password: "" };
}

function randomPassword() {
  // باسورد افتراضي قوي، الأدمن يقدر يغيّره قبل الحفظ لو حابب
  return "GoAir-" + Math.random().toString(36).slice(2, 8) + "!" + Math.floor(Math.random() * 90 + 10);
}

function TeamAdminPage() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-team", token],
    queryFn: () => adminListStaffAccounts(token),
    retry: false,
    enabled: Boolean(token),
  });

  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminStaffAccount | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) return isAdminAuthError(q.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-team", token] });

  async function submitNewStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("اكتب الاسم والإيميل، والباسورد لازم يكون 8 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      await adminCreateStaffAccount({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("تم إضافة العضو — ابعتله الإيميل والباسورد بقناة آمنة.");
      setForm(emptyForm());
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (resetPassword.length < 8) {
      toast.error("الباسورد لازم يكون 8 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      await adminSetStaffPassword({
        staffId: resetTarget.id,
        email: resetTarget.authEmail ?? "",
        password: resetPassword,
      });
      toast.success("تم تحديث الباسورد.");
      setResetTarget(null);
      setResetPassword("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(staff: AdminStaffAccount) {
    if (!confirm(`متأكد إنك عايز توقف دخول "${staff.fullName}"؟`)) return;
    try {
      await adminDeactivateStaffAccount(token, staff.id);
      toast.success("تم إيقاف الحساب.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">إضافة عضو فريق جديد</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          هيدخل لوحة التشغيل بإيميل وباسورد بدل توكن مشترك — ابعتله البيانات بعد الحفظ بقناة آمنة (مدير باسورد أو رابط مرة واحدة).
        </p>
        <form onSubmit={submitNewStaff} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="اسم العضو"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            type="email"
            placeholder="الإيميل"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              placeholder="الباسورد"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: randomPassword() })}>
              توليد
            </Button>
          </div>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90 sm:col-span-3">
            إضافة العضو
          </Button>
        </form>
      </Card>

      {resetTarget && (
        <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-primary">
            تحديث باسورد: {resetTarget.fullName}
          </h2>
          <form onSubmit={submitReset} className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="باسورد جديد"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={() => setResetPassword(randomPassword())}>
              توليد
            </Button>
            <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              حفظ
            </Button>
            <Button type="button" variant="outline" onClick={() => { setResetTarget(null); setResetPassword(""); }}>
              إلغاء
            </Button>
          </form>
        </Card>
      )}

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">فريق العمل الحالي</h2>
        <ul className="mt-4 space-y-3">
          {(q.data ?? []).map((staff) => (
            <li key={staff.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
              <div>
                <p className="font-bold text-primary">
                  {staff.fullName}
                  {!staff.isActive ? <span className="mr-2 text-xs text-destructive">(متوقف)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {staff.hasAuthAccount ? staff.authEmail : "لسه على نظام التوكن القديم — مربوطش بحساب دخول حقيقي"}
                </p>
              </div>
              <div className="flex gap-2">
                {staff.hasAuthAccount ? (
                  <Button size="sm" variant="outline" onClick={() => { setResetTarget(staff); setResetPassword(""); }}>
                    تغيير الباسورد
                  </Button>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    محتاج ربط بحساب دخول
                  </span>
                )}
                {staff.isActive ? (
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => deactivate(staff)}>
                    إيقاف الدخول
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {(q.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">مفيش أعضاء لسه.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
