import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  isPortalMembersAuthError,
  portalDeactivateMember,
  portalInviteMember,
  portalListMembers,
  portalSetMemberPassword,
  type PortalMember,
  type PortalMemberRole,
  type PortalType,
} from "@/lib/portal-members";

function randomPassword() {
  return (
    "GoAir-" + Math.random().toString(36).slice(2, 8) + "!" + Math.floor(Math.random() * 90 + 10)
  );
}

function emptyInviteForm() {
  return { email: "", password: "", role: "member" as PortalMemberRole };
}

function RoleBadge({ role }: { role: PortalMemberRole }) {
  return role === "owner" ? (
    <Badge className="bg-primary text-primary-foreground">مالك الحساب</Badge>
  ) : (
    <Badge variant="secondary">عضو</Badge>
  );
}

/**
 * صفحة إدارة أعضاء موحّدة لأي بورتال (operator/agency/partner).
 * - owner بس يقدر يضيف عضو جديد أو يوقف عضو.
 * - أي عضو (owner أو member) يقدر يغيّر باسورده هو بس.
 */
export function PortalMembersPage({
  portalType,
  token,
}: {
  portalType: PortalType;
  token: string;
}) {
  const qc = useQueryClient();
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = useQuery({
    queryKey: ["portal-members", portalType, token],
    queryFn: () => portalListMembers(portalType, token),
    retry: false,
  });

  const [inviteForm, setInviteForm] = useState(emptyInviteForm());
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState<PortalMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["portal-members", portalType, token] });

  const members = q.data ?? [];
  const me =
    members.find((m) => m.authEmail && currentEmail && m.authEmail === currentEmail) ?? null;
  const iAmOwner = me?.role === "owner";

  if (q.isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-20 animate-pulse rounded-xl border-border/80 bg-muted/40" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <Card className="rounded-xl border-border/80 p-8 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-lg font-bold text-primary">
          {isPortalMembersAuthError(q.error)
            ? "رمز الدخول غير صحيح أو الحساب غير مفعّل"
            : "حصل خطأ مؤقت. حاول تاني."}
        </p>
      </Card>
    );
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteForm.email.trim() || inviteForm.password.length < 8) {
      toast.error("اكتب إيميل صحيح، والباسورد لازم يكون 8 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      await portalInviteMember({
        portalType,
        email: inviteForm.email.trim(),
        password: inviteForm.password,
        role: inviteForm.role,
      });
      toast.success("تم إضافة العضو — ابعتله الإيميل والباسورد بقناة آمنة.");
      setInviteForm(emptyInviteForm());
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
      await portalSetMemberPassword({
        portalType,
        memberId: resetTarget.id,
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

  async function deactivate(member: PortalMember) {
    if (!confirm(`متأكد إنك عايز توقف دخول "${member.authEmail ?? "العضو ده"}"؟`)) return;
    try {
      await portalDeactivateMember(portalType, token, member.id);
      toast.success("تم إيقاف الحساب.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    }
  }

  return (
    <div className="space-y-6">
      {iAmOwner ? (
        <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-primary">إضافة عضو جديد</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            العضو الجديد هيدخل اللوحة بإيميل وباسورد خاص بيه — ابعتله البيانات بعد الحفظ بقناة آمنة
            (مدير باسورد أو رابط مرة واحدة).
          </p>
          <form onSubmit={submitInvite} className="mt-4 grid gap-3 sm:grid-cols-4">
            <Input
              type="email"
              placeholder="الإيميل"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                placeholder="الباسورد"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteForm({ ...inviteForm, password: randomPassword() })}
              >
                توليد
              </Button>
            </div>
            <Select
              value={inviteForm.role}
              onValueChange={(v) => setInviteForm({ ...inviteForm, role: v as PortalMemberRole })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">عضو</SelectItem>
                <SelectItem value="owner">مالك الحساب</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              disabled={busy}
              className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              إضافة العضو
            </Button>
          </form>
        </Card>
      ) : null}

      {resetTarget ? (
        <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-primary">
            تحديث باسورد: {resetTarget.authEmail ?? "—"}
          </h2>
          <form onSubmit={submitReset} className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="باسورد جديد"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPassword(randomPassword())}
            >
              توليد
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              حفظ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
              }}
            >
              إلغاء
            </Button>
          </form>
        </Card>
      ) : null}

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-primary">الأعضاء الحاليين</h2>
        <ul className="mt-4 space-y-3">
          {members.map((member) => {
            const isSelf = Boolean(
              member.authEmail && currentEmail && member.authEmail === currentEmail,
            );
            const canResetThis = iAmOwner || isSelf;
            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 p-3"
              >
                <div>
                  <p className="flex items-center gap-2 font-bold text-primary">
                    {member.authEmail ?? "—"}
                    {isSelf ? <span className="text-xs text-muted-foreground">(انت)</span> : null}
                    {!member.isActive ? (
                      <span className="text-xs text-destructive">(متوقف)</span>
                    ) : null}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={member.role} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {member.isActive && canResetThis ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetTarget(member);
                        setResetPassword("");
                      }}
                    >
                      تغيير الباسورد
                    </Button>
                  ) : null}
                  {member.isActive && iAmOwner && !isSelf ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deactivate(member)}
                    >
                      إيقاف الدخول
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش أعضاء لسه.</p>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
