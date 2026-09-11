import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreateGroundHandlingPartner,
  adminDeleteGroundHandlingPartner,
  adminGenerateGroundHandlingStatement,
  adminListGroundHandlingPartners,
  adminListGroundHandlingRequests,
  adminListGroundHandlingServices,
  adminListGroundHandlingStatements,
  adminReviewGroundHandlingService,
  adminUpdateGroundHandlingPartner,
  adminUpdateGroundHandlingStatement,
  formatGroundHandlingDate,
  groundHandlingServiceStatusLabel,
  groundHandlingStatementStatusLabel,
  groundHandlingStatusLabel,
  REQUEST_STATUS_ORDER,
  type GroundHandlingPartner,
  type GroundHandlingRequestStatus,
  type GroundHandlingServiceStatus,
  type GroundHandlingStatementStatus,
} from "@/lib/ground-handling";
import { isAdminAuthError } from "@/lib/admin";
import { useAdminToken } from "@/lib/admin-session";
import { adminInvitePortalOwner } from "@/lib/portal-members";

export const Route = createFileRoute("/admin/ground-handling")({
  head: () => ({
    meta: [{ title: "التشغيل الأرضي — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminGroundHandlingPage,
});

function AdminGroundHandlingPage() {
  const token = useAdminToken();

  const partnersQuery = useQuery({
    queryKey: ["admin-ground-handling-partners", token],
    queryFn: () => adminListGroundHandlingPartners(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (partnersQuery.isPending) return <AdminLoading />;
  if (partnersQuery.isError) {
    return isAdminAuthError(partnersQuery.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const partners = partnersQuery.data ?? [];

  return (
    <Tabs defaultValue="partners">
      <TabsList>
        <TabsTrigger value="partners">الشركاء ({partners.length})</TabsTrigger>
        <TabsTrigger value="requests">طلبات الخدمات</TabsTrigger>
        <TabsTrigger value="services">مراجعة الخدمات</TabsTrigger>
        <TabsTrigger value="statements">التسويات المالية</TabsTrigger>
      </TabsList>

      <TabsContent value="partners">
        <PartnersTab token={token} partners={partners} onRefresh={() => partnersQuery.refetch()} />
      </TabsContent>
      <TabsContent value="requests">
        <RequestsTab token={token} />
      </TabsContent>
      <TabsContent value="services">
        <ServicesReviewTab token={token} partners={partners} />
      </TabsContent>
      <TabsContent value="statements">
        <StatementsTab token={token} partners={partners} />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// تبويب: الشركاء
// ---------------------------------------------------------------------------

function PartnersTab({
  token,
  partners,
  onRefresh,
}: {
  token: string;
  partners: GroundHandlingPartner[];
  onRefresh: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-3 mt-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-primary">شركاء التشغيل الأرضي</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              إضافة شريك
            </Button>
          </DialogTrigger>
          <CreatePartnerDialog
            token={token}
            onDone={() => {
              setCreateOpen(false);
              onRefresh();
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
            <PartnerCard key={partner.id} partner={partner} token={token} onDone={onRefresh} />
          ))}
        </div>
      )}
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
      await adminCreateGroundHandlingPartner(token, {
        name: name.trim(),
        airportCode: airportCode.trim(),
        country: country.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
      });
      toast.success("تم إنشاء الشريك — دلوقتي تقدر تعمله دعوة حساب دخول من كارت الشريك.");
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
            <Input
              id="gh-airport"
              dir="ltr"
              value={airportCode}
              onChange={(e) => setAirportCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gh-country">الدولة (اختياري)</Label>
            <Input id="gh-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gh-email">إيميل التواصل (اختياري)</Label>
            <Input
              id="gh-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gh-phone">تليفون التواصل (اختياري)</Label>
            <Input
              id="gh-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={busy}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
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
  partner: GroundHandlingPartner;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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
          {partner.name}{" "}
          {!partner.isActive ? <span className="text-destructive">(غير مفعّل)</span> : null}
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
          <InvitePartnerOwnerDialog partner={partner} onDone={() => setInviteOpen(false)} />
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
  partner: GroundHandlingPartner;
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
        هينشئ حساب Supabase Auth (owner) لبوابة التشغيل الأرضي — الشريك هيدخل بالإيميل والباسورد
        دول.
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
          <Button
            type="submit"
            disabled={busy}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
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
  partner: GroundHandlingPartner;
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
            <Input
              id="edit-gh-airport"
              dir="ltr"
              value={airportCode}
              onChange={(e) => setAirportCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gh-country">الدولة</Label>
            <Input
              id="edit-gh-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-gh-email">إيميل التواصل</Label>
            <Input
              id="edit-gh-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gh-phone">تليفون التواصل</Label>
            <Input
              id="edit-gh-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={busy}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {busy ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// تبويب: طلبات الخدمات
// ---------------------------------------------------------------------------

function RequestsTab({ token }: { token: string }) {
  const [status, setStatus] = useState<GroundHandlingRequestStatus | null>(null);

  const requestsQuery = useQuery({
    queryKey: ["admin-ground-handling-requests", token, status],
    queryFn: () => adminListGroundHandlingRequests(token, status),
    retry: false,
  });

  const requests = requestsQuery.data ?? [];

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterPill active={status === null} onClick={() => setStatus(null)} label="الكل" />
        {REQUEST_STATUS_ORDER.map((s) => (
          <FilterPill
            key={s}
            active={status === s}
            onClick={() => setStatus(s)}
            label={groundHandlingStatusLabel(s)}
          />
        ))}
      </div>

      {requestsQuery.isPending ? (
        <AdminLoading />
      ) : requestsQuery.isError ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          حصل خطأ في تحميل الطلبات.
        </Card>
      ) : requests.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش طلبات في القسم ده.
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card
              key={req.requestId}
              className="rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-primary">
                    {req.serviceName}{" "}
                    {req.isUrgent ? <span className="text-destructive">· عاجل</span> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {req.passengerName} — {req.phoneNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {req.origin} ← {req.destination}
                    {req.airportName ? ` · ${req.airportName}` : ""}
                    {req.flightNumber ? ` · رحلة ${req.flightNumber}` : ""}
                    {" · "}
                    {req.partnerName}
                  </p>
                  {req.assignedStaffName ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      الموظف المسؤول: {req.assignedStaffName}
                    </p>
                  ) : null}
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
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// تبويب: مراجعة الخدمات (طابور الاعتماد)
// ---------------------------------------------------------------------------

const SERVICE_STATUS_TABS: { value: GroundHandlingServiceStatus | null; label: string }[] = [
  { value: "pending_review", label: "قيد المراجعة" },
  { value: null, label: "الكل" },
  { value: "approved", label: "معتمدة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "paused", label: "متوقفة مؤقتًا" },
  { value: "deletion_requested", label: "طلب حذف" },
];

function ServicesReviewTab({
  token,
  partners,
}: {
  token: string;
  partners: GroundHandlingPartner[];
}) {
  const [status, setStatus] = useState<GroundHandlingServiceStatus | null>("pending_review");
  const [partnerId, setPartnerId] = useState<string>("all");
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["admin-ground-handling-services", token, partnerId, status],
    queryFn: () =>
      adminListGroundHandlingServices(token, partnerId === "all" ? null : partnerId, status),
    retry: false,
  });

  const services = servicesQuery.data ?? [];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-ground-handling-services", token] });
  }

  async function approve(serviceId: string) {
    setBusyId(serviceId);
    try {
      await adminReviewGroundHandlingService(token, serviceId, "approve");
      toast.success("تمت الموافقة على الخدمة.");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!rejectNotes.trim()) {
      toast.error("لازم تكتب سبب الرفض عشان الشريك يعرف يعدّل.");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await adminReviewGroundHandlingService(token, rejectTarget.id, "reject", rejectNotes.trim());
      toast.success("تم رفض الخدمة وإرسال السبب للشريك.");
      setRejectTarget(null);
      setRejectNotes("");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {SERVICE_STATUS_TABS.map((tab) => (
            <FilterPill
              key={tab.label}
              active={status === tab.value}
              onClick={() => setStatus(tab.value)}
              label={tab.label}
            />
          ))}
        </div>
        <Select value={partnerId} onValueChange={setPartnerId}>
          <SelectTrigger className="w-auto min-w-40">
            <SelectValue placeholder="كل الشركاء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الشركاء</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {servicesQuery.isPending ? (
        <AdminLoading />
      ) : servicesQuery.isError ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          حصل خطأ في تحميل الخدمات.
        </Card>
      ) : services.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش خدمات في القسم ده.
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <Card
              key={s.id}
              className="rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-primary">{s.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {s.partnerName} · {s.airportCode}
                    {s.terminal ? ` · صالة ${s.terminal}` : ""}
                    {s.direction ? ` · ${s.direction === "arrival" ? "وصول" : "مغادرة"}` : ""}
                  </p>
                  {s.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  ) : null}
                  {s.requirements ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      المتطلبات: {s.requirements}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-bold text-primary">{s.priceUsd.toFixed(2)}$</p>
                  {s.status === "rejected" && s.adminNotes ? (
                    <p className="mt-1 text-sm text-destructive">
                      سبب الرفض السابق: {s.adminNotes}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
                    {groundHandlingServiceStatusLabel(s.status)}
                    {s.pendingAction ? " (قيد المراجعة)" : ""}
                  </span>
                  {s.status === "pending_review" || s.status === "deletion_requested" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === s.id}
                        onClick={() => approve(s.id)}
                        className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                      >
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === s.id}
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setRejectTarget({ id: s.id, name: s.name });
                          setRejectNotes("");
                        }}
                      >
                        رفض
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض خدمة: {rejectTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">سبب الرفض (هيظهر للشريك)</Label>
              <Textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={busyId === rejectTarget?.id}
                className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
              >
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// تبويب: التسويات المالية
// ---------------------------------------------------------------------------

function StatementsTab({ token, partners }: { token: string; partners: GroundHandlingPartner[] }) {
  const [partnerId, setPartnerId] = useState<string>("all");
  const [generateOpen, setGenerateOpen] = useState(false);
  const queryClient = useQueryClient();

  const statementsQuery = useQuery({
    queryKey: ["admin-ground-handling-statements", token, partnerId],
    queryFn: () => adminListGroundHandlingStatements(token, partnerId === "all" ? null : partnerId),
    retry: false,
  });

  const statements = statementsQuery.data ?? [];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-ground-handling-statements", token] });
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Select value={partnerId} onValueChange={setPartnerId}>
          <SelectTrigger className="w-auto min-w-40">
            <SelectValue placeholder="كل الشركاء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الشركاء</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              توليد تسوية جديدة
            </Button>
          </DialogTrigger>
          <GenerateStatementDialog
            token={token}
            partners={partners}
            onDone={() => {
              setGenerateOpen(false);
              refresh();
            }}
          />
        </Dialog>
      </div>

      {statementsQuery.isPending ? (
        <AdminLoading />
      ) : statementsQuery.isError ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          حصل خطأ في تحميل التسويات.
        </Card>
      ) : statements.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش تسويات لسه.
        </Card>
      ) : (
        <div className="space-y-3">
          {statements.map((st) => (
            <StatementCard key={st.id} statement={st} token={token} onDone={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function GenerateStatementDialog({
  token,
  partners,
  onDone,
}: {
  token: string;
  partners: GroundHandlingPartner[];
  onDone: () => void;
}) {
  const [partnerId, setPartnerId] = useState<string>(partners[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId || !periodStart || !periodEnd) {
      toast.error("اختار الشريك وحدد فترة التسوية.");
      return;
    }
    setBusy(true);
    try {
      await adminGenerateGroundHandlingStatement(token, partnerId, periodStart, periodEnd);
      toast.success("تم توليد التسوية.");
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
        <DialogTitle>توليد تسوية مالية</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>الشريك</Label>
          <Select value={partnerId} onValueChange={setPartnerId}>
            <SelectTrigger>
              <SelectValue placeholder="اختار شريك" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="period-start">من تاريخ</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period-end">إلى تاريخ</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={busy}
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {busy ? "جاري التوليد..." : "توليد"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

const STATEMENT_STATUS_OPTIONS: GroundHandlingStatementStatus[] = ["draft", "sent", "paid"];

function StatementCard({
  statement,
  token,
  onDone,
}: {
  statement: {
    id: string;
    partnerName: string;
    periodStart: string;
    periodEnd: string;
    totalCompleted: number;
    totalDueUsd: number;
    paidUsd: number;
    remainingUsd: number;
    status: GroundHandlingStatementStatus;
  };
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [status, setStatus] = useState<GroundHandlingStatementStatus>(statement.status);
  const [paidUsd, setPaidUsd] = useState(String(statement.paidUsd));
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const paidValue = Number(paidUsd);
    if (Number.isNaN(paidValue) || paidValue < 0) {
      toast.error("اكتب مبلغ صحيح.");
      return;
    }
    setBusy(true);
    try {
      await adminUpdateGroundHandlingStatement(token, statement.id, status, paidValue);
      toast.success("تم التحديث.");
      setEditOpen(false);
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
        <p className="font-display text-base font-bold text-primary">{statement.partnerName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatGroundHandlingDate(statement.periodStart)} —{" "}
          {formatGroundHandlingDate(statement.periodEnd)}
        </p>
        <p className="mt-1 text-sm">
          {statement.totalCompleted} خدمة مكتملة · مستحق {statement.totalDueUsd.toFixed(2)}$ · مدفوع{" "}
          {statement.paidUsd.toFixed(2)}$ ·{" "}
          <span className="font-bold text-primary">متبقي {statement.remainingUsd.toFixed(2)}$</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-primary">
          {groundHandlingStatementStatusLabel(statement.status)}
        </span>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              تحديث الحالة/المدفوع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث تسوية {statement.partnerName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as GroundHandlingStatementStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATEMENT_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {groundHandlingStatementStatusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-usd">المبلغ المدفوع (دولار)</Label>
                <Input
                  id="paid-usd"
                  type="number"
                  step="0.01"
                  min="0"
                  dir="ltr"
                  value={paidUsd}
                  onChange={(e) => setPaidUsd(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                >
                  {busy ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
