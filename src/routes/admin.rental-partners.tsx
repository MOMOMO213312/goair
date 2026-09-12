import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminListRentalPartners,
  adminRejectRentalPartner,
  adminVerifyRentalPartner,
  isAdminAuthError,
  rentalVerificationStatusLabel,
  type AdminRentalPartnerRow,
} from "@/lib/admin";
import { useAdminToken } from "@/lib/admin-session";
import { adminInvitePortalOwner } from "@/lib/portal-members";

export const Route = createFileRoute("/admin/rental-partners")({
  head: () => ({
    meta: [{ title: "مزوّدو تأجير السيارات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminRentalPartnersPage,
});

function AdminRentalPartnersPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  const partnersQuery = useQuery({
    queryKey: ["admin-rental-partners", token],
    queryFn: () => adminListRentalPartners(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (partnersQuery.isPending) return <AdminLoading />;
  if (partnersQuery.isError) {
    return isAdminAuthError(partnersQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const partners = partnersQuery.data ?? [];
  const pending = partners.filter((p) => p.verificationStatus === "pending_review");
  const individuals = partners.filter((p) => p.providerType === "individual" && p.verificationStatus !== "pending_review");
  const companies = partners.filter((p) => p.providerType === "company" && p.verificationStatus !== "pending_review");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-rental-partners", token] });
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        الحسابات دي بتتعمل تلقائيًا لما توافق على طلب انضمام. من هنا تديهم حساب دخول (إيميل/باسورد) لبوابتهم
        — بعدها هما اللي بيضيفوا عرباتهم بنفسهم. لازم تعتمد المزوّد الأول قبل ما يقدر يشتغل بشكل كامل.
      </p>
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-extrabold text-amber-600">
            بانتظار الاعتماد ({pending.length})
          </h2>
          <PartnerList partners={pending} onDone={invalidate} empty="" />
        </section>
      )}
      <section>
        <h2 className="mb-3 font-display text-lg font-extrabold text-primary">شركات تأجير ({companies.length})</h2>
        <PartnerList partners={companies} onDone={invalidate} empty="مفيش شركات تأجير لسه." />
      </section>
      <section>
        <h2 className="mb-3 font-display text-lg font-extrabold text-primary">أفراد ({individuals.length})</h2>
        <PartnerList partners={individuals} onDone={invalidate} empty="مفيش مزوّدين أفراد لسه." />
      </section>
    </div>
  );
}

function PartnerList({
  partners,
  onDone,
  empty,
}: {
  partners: AdminRentalPartnerRow[];
  onDone: () => void;
  empty: string;
}) {
  if (partners.length === 0) {
    return (
      <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {empty}
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {partners.map((p) => (
        <PartnerCard key={p.id} partner={p} onDone={onDone} />
      ))}
    </div>
  );
}

function PartnerCard({ partner, onDone }: { partner: AdminRentalPartnerRow; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const token = useAdminToken();
  const hasLogin = Boolean(partner.authUserId);

  async function handleVerify() {
    if (!token) return;
    setBusy(true);
    try {
      await adminVerifyRentalPartner(token, partner.id);
      toast.success(`تم اعتماد ${partner.companyName || partner.fullName}.`);
      setVerifyOpen(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!token) return;
    if (!rejectReason.trim()) {
      toast.error("لازم تكتب سبب الرفض.");
      return;
    }
    setBusy(true);
    try {
      await adminRejectRentalPartner(token, partner.id, rejectReason.trim());
      toast.success(`تم رفض ${partner.companyName || partner.fullName}.`);
      setRejectOpen(false);
      setRejectReason("");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-bold text-primary">
            {partner.companyName || partner.fullName}
          </p>
          <Badge
            variant={
              partner.verificationStatus === "verified"
                ? "default"
                : partner.verificationStatus === "rejected"
                  ? "destructive"
                  : "outline"
            }
          >
            {rentalVerificationStatusLabel(partner.verificationStatus)}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {partner.companyName ? `مسؤول التواصل: ${partner.fullName} · ` : ""}
          {partner.phoneNumber} · {partner.country} · {partner.vehiclesCount} عربية
        </p>
        <p className="mt-0.5 text-xs font-bold text-accent">
          {hasLogin ? "عنده حساب دخول" : "مفيش حساب دخول لسه"}
        </p>
        {partner.verificationStatus === "rejected" && partner.rejectionReason && (
          <p className="mt-0.5 text-xs text-destructive">سبب الرفض: {partner.rejectionReason}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {partner.verificationStatus !== "verified" && (
          <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                اعتماد
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>اعتماد {partner.companyName || partner.fullName}؟</AlertDialogTitle>
                <AlertDialogDescription>
                  هيقدر بعدها يضيف عرباته ويستقبل حجوزات على البوابة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
                <Button onClick={handleVerify} disabled={busy}>
                  {busy ? "جاري الاعتماد..." : "تأكيد الاعتماد"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {partner.verificationStatus !== "rejected" && (
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive">
                رفض
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفض {partner.companyName || partner.fullName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">سبب الرفض</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثلاً: الأوراق غير واضحة أو ناقصة"
                />
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={handleReject} disabled={busy}>
                  {busy ? "جاري الرفض..." : "تأكيد الرفض"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant={hasLogin ? "outline" : "default"}>
              {hasLogin ? "إعادة تعيين الدخول" : "دعوة لتسجيل الدخول"}
            </Button>
          </DialogTrigger>
          <InvitePartnerOwnerDialog partner={partner} onDone={() => { setOpen(false); onDone(); }} />
        </Dialog>
      </div>
    </Card>
  );
}

function InvitePartnerOwnerDialog({
  partner,
  onDone,
}: {
  partner: AdminRentalPartnerRow;
  onDone: () => void;
}) {
  const [email, setEmail] = useState(partner.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.trim().length < 8) {
      toast.error("الإيميل مطلوب، والباسورد لازم يكون 8 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      await adminInvitePortalOwner({
        portalType: "rental",
        entityId: partner.id,
        email: email.trim(),
        password: password.trim(),
      });
      toast.success(`تم إنشاء حساب الدخول لـ ${email.trim()}. ابعتله الإيميل والباسورد.`);
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
        <DialogTitle>دعوة حساب دخول لـ {partner.companyName || partner.fullName}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        هينشئ حساب Supabase Auth (owner) لبوابة مزوّد التأجير — المزوّد هيدخل بالإيميل والباسورد دول.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">الإيميل</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">الباسورد</Label>
          <Input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? "جاري الحفظ..." : "تأكيد"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
