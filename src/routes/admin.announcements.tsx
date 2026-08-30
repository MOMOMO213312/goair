import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminListAnnouncements,
  adminSetAnnouncementActive,
} from "@/lib/announcements";
import { isAdminAuthError } from "@/lib/admin";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({ meta: [{ title: "الإشعارات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { token } = Route.useSearch();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-announcements", token], queryFn: () => adminListAnnouncements(token), retry: false, enabled: Boolean(token) });
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) return isAdminAuthError(q.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-announcements", token] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast.error("اكتب نص الإعلان."); return; }
    setBusy(true);
    try {
      await adminCreateAnnouncement(token, message.trim(), link.trim() || null);
      toast.success("تم إضافة الإعلان — هيظهر في الشريط فورًا.");
      setMessage(""); setLink("");
      refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
    finally { setBusy(false); }
  }

  async function toggle(id: string, isActive: boolean) {
    try { await adminSetAnnouncementActive(token, id, !isActive); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
  }

  async function remove(id: string) {
    try { await adminDeleteAnnouncement(token, id); toast.success("تم الحذف."); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
  }

  return (
    <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-display text-lg font-extrabold text-primary">شريط الإعلانات في الصفحة الرئيسية</h2>
      <p className="mt-1 text-sm text-muted-foreground">أي إعلان "مفعّل" هنا بيظهر فورًا في الشريط أعلى الموقع لكل الزوار.</p>

      <form onSubmit={submit} className="mt-5 flex flex-wrap gap-2">
        <Input placeholder="نص الإعلان" value={message} onChange={(e) => setMessage(e.target.value)} className="min-w-60 flex-1" />
        <Input placeholder="رابط (اختياري)" value={link} onChange={(e) => setLink(e.target.value)} className="min-w-40 flex-1" />
        <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">إضافة</Button>
      </form>

      <ul className="mt-6 space-y-2">
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 p-3">
            <span className="text-sm text-primary">{a.message}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle(a.id, a.isActive)}>
                {a.isActive ? "إيقاف" : "تفعيل"}
              </Button>
              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => remove(a.id)}>
                حذف
              </Button>
            </div>
          </li>
        ))}
        {(q.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">مفيش إعلانات لسه.</p> : null}
      </ul>
    </Card>
  );
}
