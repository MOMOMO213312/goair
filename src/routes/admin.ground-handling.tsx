import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
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
import {
  adminCreateGroundHandlingPartner,
  adminDeleteGroundHandlingPartner,
  adminListGroundHandlingPartners,
  adminListGroundHandlingRequests,
  adminUpdateGroundHandlingPartner,
  groundHandlingStatusLabel,
  isAdminAuthError,
  type GroundHandlingPartnerRow,
} from "@/lib/admin";
import { useAdminToken } from "@/lib/admin-session";
import { adminInvitePortalOwner } from "@/lib/portal-members";

export const Route = createFileRoute("/admin/ground-handling")({
  head: () => ({
    meta: [
      { title: "شركاء التشغيل الأرضي — لوحة تشغيل GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGroundHandlingPage,
});

function AdminGroundHandlingPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [requestsStatus, setRequestsStatus] = useState<string | null>(null);

  const partnersQuery = useQuery({
    queryKey: ["admin-ground-handling-partners", token],
    queryFn: () => adminListGroundHandlingPartners(token),
    retry: false,
    enabled: Boolean(token),
  });

  const requestsQuery = useQuery({
    queryKey: ["admin-ground-handling-requests", token, requestsStatus],
    queryFn: () => adminListGroundHandlingRequests(token, requestsStatus),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (partnersQuery.isPending) return <AdminLoading />;
  if (partnersQuery.isError) {
    return isAdminAuthError(partnersQuery.error) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const partners = partnersQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  function invalidatePartners() {
    queryClient.invalidateQueries({ queryKey: ["admin-ground-handling-partners", token] });
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-primary">
            شركاء التشغيل الأرضي ({partners.length})
          </h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                إضافة شريك
              </Button>
            </DialogTrigger>
            <CreatePartnerDialog
              token={token}
              onDone={() => {
                setCreateOpen(false);
                invalidatePartners();
              }}
            />
          </Dialog>
        </div>

        {partners.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            مفيش شركاء تشغيل أرضي لسه.
          </Card>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} token={token} onDone={invalidatePartners} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-extrabold text-primary">طلبات الخدمات الإضافية</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { value: null, label: "الكل" },
            { value: "pending", label: "مطلوبة" },
            { value: "in_progress", label: "جاري التجهيز" },
            { value: "done", label: "تمت" },
            { value: "cancelled", label: "ملغاة" },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setRequestsStatus(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                requestsStatus === tab.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {requestsQuery.isPending ? (
          <AdminLoading />
        ) : requests.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            مفيش طلبات في القسم ده.
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.requestId} className="rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-primary">{req.serviceName}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {req.passengerName} — {req.phoneNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {req.origin} ← {req.destination}
                      {req.airportCode ? ` · ${req.airportCode}` : ""}
                      {req.partnerName ? ` · الشريك: ${req.partnerName}` : " · لسه ما اتوزعتش على شريك"}
                    </p>
                    {req.partnerNotes ? (
                      <p className="mt-1 text-sm text-primary">ملاحظات: {req.partnerNotes}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
                    {groundHandlingStatusLabel(req.status)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CreatePartnerDialog({ token, onDone }: { token: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [airportCode, setAirportCode] = useState("");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !airportCode.trim()) {
      toast.error("الاسم وكود المطار مطلوبين.");
      return;
    }
    setBusy(true);
    try {
      const created = await adminCreateGroundHandlingPartner(token, {
        name: name.trim(),
        airportCode: airportCode.trim(),
        country: country.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
      });
      toast.success(`تم إنشاء الشريك. رمز الدخول: ${created.accessToken}`);
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
        <DialogTitle>إضافة شريك تشغيل أرضي</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gh-name">اسم الشريك</Label>
          <Input id="gh-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gh-airport">كود المطار</Label>
            <Input id="gh-airport" dir="ltr" value={airportCode} onChange={(e) => setAirportCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gh-country">الدولة (اختياري)</Label>
            <Input id="gh-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gh-email">إيميل التواصل (اختياري)</Label>
            <Input id="gh-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gh-phone">تليفون التواصل (اختياري)</Label>
            <Input id="gh-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? "جاري الحفظ..." : "إنشاء"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function PartnerCard({
  partner,
  token,
  onDone,
}: {
  partner: GroundHandlingPartnerRow;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function copyToken() {
    navigator.clipboard.writeText(partner.accessToken);
    toast.success("تم نسخ رمز الدخول.");
  }

  async function toggleActive() {
    setBusy(true);
    try {
      await adminUpdateGroundHandlingPartner(token, partner.id, {
        name: partner.name,
        airportCode: partner.airportCode,
        country: partner.country,
        contactEmail: partner.contactEmail,
        contactPhone: partner.contactPhone,
        isActive: !partner.isActive,
      });
      toast.success("تم التحديث.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`متأكد إنك عايز تمسح "${partner.name}"؟`)) return;
    setBusy(true);
    try {
      await adminDeleteGroundHandlingPartner(token, partner.id);
      toast.success("تم الحذف.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {partner.name} {!partner.isActive ? <span className="text-destructive">(غير مفعّل)</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {partner.airportCode}
          {partner.country ? ` · ${partner.country}` : ""}
        </p>
        {partner.contactEmail || partner.contactPhone ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {partner.contactEmail ?? ""}
            {partner.contactEmail && partner.contactPhone ? " · " : ""}
            {partner.contactPhone ?? ""}
          </p>
        ) : null}
        <button
          onClick={copyToken}
          className="mt-1 flex items-center gap-1 text-xs font-bold text-accent hover:underline"
        >
          <Copy className="size-3" /> نسخ رمز الدخول
        </button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={toggleActive}>
          {partner.isActive ? "إيقاف" : "تفعيل"}
        </Button>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              دعوة حساب دخول
            </Button>
          </DialogTrigger>
          <InvitePartnerOwnerDialog
            partner={partner}
            onDone={() => setInviteOpen(false)}
          />
        </Dialog>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              تعديل
            </Button>
          </DialogTrigger>
          <EditPartnerDialog
            partner={partner}
            token={token}
            onDone={() => {
              setEditOpen(false);
              onDone();
            }}
          />
        </Dialog>
        <Button size="sm" variant="outline" disabled={busy} onClick={handleDelete}>
          حذف
        </Button>
      </div>
    </Card>
  );
}

function InvitePartnerOwnerDialog({
  partner,
  onDone,
}: {
  partner: GroundHandlingPartnerRow;
  onDone: () => void;
}) {
  const [email, setEmail] = useState(partner.contactEmail ?? "");
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
        portalType: "ground_handling",
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
        <DialogTitle>دعوة حساب دخول لـ {partner.name}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        هينشئ حساب Supabase Auth (owner) لبوابة التشغيل الأرضي — الشريك هيدخل بالإيميل
        والباسورد دول بدل رمز الدخول القديم.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gh-invite-email">البريد الإلكتروني</Label>
          <Input
            id="gh-invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gh-invite-password">كلمة سر مبدئية</Label>
          <Input
            id="gh-invite-password"
            type="text"
            dir="ltr"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditPartnerDialog({
  partner,
  token,
  onDone,
}: {
  partner: GroundHandlingPartnerRow;
  token: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(partner.name);
  const [airportCode, setAirportCode] = useState(partner.airportCode);
  const [country, setCountry] = useState(partner.country ?? "");
  const [contactEmail, setContactEmail] = useState(partner.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(partner.contactPhone ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpdateGroundHandlingPartner(token, partner.id, {
        name: name.trim(),
        airportCode: airportCode.trim(),
        country: country.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        isActive: partner.isActive,
      });
      toast.success("تم التحديث.");
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
        <DialogTitle>تعديل {partner.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-gh-name">اسم الشريك</Label>
          <Input id="edit-gh-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-gh-airport">كود المطار</Label>
            <Input id="edit-gh-airport" dir="ltr" value={airportCode} onChange={(e) => setAirportCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gh-country">الدولة</Label>
            <Input id="edit-gh-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-gh-email">إيميل التواصل</Label>
            <Input id="edit-gh-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gh-phone">تليفون التواصل</Label>
            <Input id="edit-gh-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
