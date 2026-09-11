import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { GHLoading, GHEmpty, GHAuthError } from "@/components/ground-handling/ground-handling-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  listGroundHandlingStaff,
  createGroundHandlingStaff,
  updateGroundHandlingStaff,
  deleteGroundHandlingStaff,
  isGroundHandlingAuthError,
  type GroundHandlingStaff,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/staff")({
  head: () => ({ meta: [{ title: "الموظفون — بوابة GOAIR للخدمات الأرضية" }] }),
  component: StaffPage,
});

const PERMISSION_OPTIONS = [
  { value: "handle_requests", label: "تنفيذ الطلبات" },
  { value: "manage_services", label: "إدارة الخدمات" },
  { value: "view_reports", label: "عرض التقارير" },
];

function StaffPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroundHandlingStaff | null>(null);

  const staffQuery = useQuery({
    queryKey: ["ground-handling-staff-list", token],
    queryFn: () => listGroundHandlingStaff(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ground-handling-staff-list", token] });
  }

  if (staffQuery.isError) {
    if (isGroundHandlingAuthError(staffQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const staff = staffQuery.data ?? [];

  async function handleDelete(member: GroundHandlingStaff) {
    if (!confirm(`حذف الموظف "${member.fullName}"؟`)) return;
    try {
      await deleteGroundHandlingStaff(token as string, member.id);
      toast.success("تم حذف الموظف.");
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" aria-hidden />
          إضافة موظف
        </Button>
      </div>

      {staffQuery.isPending ? (
        <GHLoading />
      ) : staff.length === 0 ? (
        <GHEmpty>لسه معملتش موظفين. ابدأ بإضافة أول موظف.</GHEmpty>
      ) : (
        <div className="space-y-3">
          {staff.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
              <div>
                <p className="font-display text-base font-bold text-primary">
                  {m.fullName}
                  {!m.isActive ? <span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">موقوف</span> : null}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {m.role ?? "—"}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.permissions.map((p) => PERMISSION_OPTIONS.find((o) => o.value === p)?.label ?? p).join(" · ") || "بدون صلاحيات محددة"}
                  {" · "}{m.assignedOpenCount} طلب مسند حاليًا
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(m); setDialogOpen(true); }}>تعديل</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(m)}>حذف</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StaffFormDialog token={token} open={dialogOpen} member={editing} onOpenChange={setDialogOpen} onSaved={invalidate} />
    </div>
  );
}

function StaffFormDialog({
  token,
  open,
  member,
  onOpenChange,
  onSaved,
}: {
  token: string;
  open: boolean;
  member: GroundHandlingStaff | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const key = member?.id ?? "new";
  if (open && key !== openedFor) {
    setOpenedFor(key);
    setFullName(member?.fullName ?? "");
    setRole(member?.role ?? "");
    setPhone(member?.phone ?? "");
    setIsActive(member?.isActive ?? true);
    setPermissions(member?.permissions ?? []);
  }

  function togglePermission(value: string) {
    setPermissions((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (member) {
        await updateGroundHandlingStaff(token, member.id, { fullName, role: role || null, phone: phone || null, isActive, permissions });
      } else {
        await createGroundHandlingStaff(token, { fullName, role: role || null, phone: phone || null, permissions });
      }
      toast.success("تم الحفظ.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "تعديل موظف" : "إضافة موظف"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>الاسم الكامل</Label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>الوظيفة</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>الصلاحيات</Label>
            <div className="flex flex-wrap gap-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => togglePermission(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                    permissions.includes(opt.value) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {member ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="mb-0">نشط</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          ) : null}
          <Button type="submit" disabled={busy} className="w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            {busy ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
