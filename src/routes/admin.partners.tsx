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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminCreateAgency,
  adminCreateAirlinePartner,
  adminCreateOperator,
  adminDeleteAgency,
  adminDeleteAirlinePartner,
  adminDeleteOperator,
  adminListAgencies,
  adminListAirlinePartners,
  adminListOperatorsFull,
  adminUpdateAgency,
  adminUpdateAirlinePartner,
  adminUpdateOperator,
  isAdminAuthError,
  payoutModelLabel,
  type AdminAgencyRow,
  type AdminAirlinePartnerRow,
  type AdminOperatorRow,
} from "@/lib/admin";
import { useAdminToken } from "@/lib/admin-session";
import { adminInvitePortalOwner, type PortalType } from "@/lib/portal-members";

export const Route = createFileRoute("/admin/partners")({
  head: () => ({
    meta: [
      { title: "الوكالات والشركاء والمشغّلين — لوحة تشغيل GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPartnersPage,
});

function AdminPartnersPage() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-extrabold text-primary">
        الوكالات والشركاء والمشغّلين
      </h2>
      <Tabs defaultValue="agencies">
        <TabsList>
          <TabsTrigger value="agencies">وكالات السياحة</TabsTrigger>
          <TabsTrigger value="airline-partners">شركاء الطيران</TabsTrigger>
          <TabsTrigger value="operators">شركات النقل</TabsTrigger>
        </TabsList>
        <TabsContent value="agencies">
          <AgenciesTab />
        </TabsContent>
        <TabsContent value="airline-partners">
          <AirlinePartnersTab />
        </TabsContent>
        <TabsContent value="operators">
          <OperatorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// شكل مشترك للكارت — اسم، معلومات، زرار دعوة حساب دخول، تفعيل/إيقاف، تعديل، حذف.
function EntityCardShell({
  title,
  subtitle,
  isActive,
  accessToken,
  busy,
  onToggleActive,
  onInvite,
  onDelete,
  editDialog,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  isActive: boolean;
  accessToken: string;
  busy: boolean;
  onToggleActive: () => void;
  onInvite: () => void;
  onDelete: () => void;
  editDialog: React.ReactNode;
}) {
  function copyToken() {
    navigator.clipboard.writeText(accessToken);
    toast.success("تم نسخ رمز الدخول.");
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {title} {!isActive ? <span className="text-destructive">(غير مفعّل)</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        <button
          onClick={copyToken}
          className="mt-1 flex items-center gap-1 text-xs font-bold text-accent hover:underline"
        >
          <Copy className="size-3" /> نسخ رمز الدخول
        </button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={onToggleActive}>
          {isActive ? "إيقاف" : "تفعيل"}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onInvite}>
          دعوة حساب دخول
        </Button>
        {editDialog}
        <Button size="sm" variant="outline" disabled={busy} onClick={onDelete}>
          حذف
        </Button>
      </div>
    </Card>
  );
}

function InviteOwnerDialog({
  open,
  onOpenChange,
  portalType,
  entityId,
  entityName,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portalType: PortalType;
  entityId: string;
  entityName: string;
  defaultEmail: string | null;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
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
        portalType,
        entityId,
        email: email.trim(),
        password: password.trim(),
      });
      toast.success(`تم إنشاء حساب الدخول لـ ${email.trim()}. ابعتله الإيميل والباسورد.`);
      onOpenChange(false);
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
          <DialogTitle>دعوة حساب دخول لـ {entityName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          هينشئ حساب Supabase Auth (owner) — هيدخل بالإيميل والباسورد دول بدل رمز الدخول القديم.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">البريد الإلكتروني</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">كلمة سر مبدئية</Label>
            <Input
              id="invite-password"
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
    </Dialog>
  );
}

// ===================== وكالات السياحة =====================

function AgenciesTab() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ["admin-agencies", token],
    queryFn: () => adminListAgencies(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (query.isPending) return <AdminLoading />;
  if (query.isError) {
    return isAdminAuthError(query.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const agencies = query.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-agencies", token] });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{agencies.length} وكالة</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              إضافة وكالة
            </Button>
          </DialogTrigger>
          <CreateAgencyDialog
            token={token}
            onDone={() => {
              setCreateOpen(false);
              invalidate();
            }}
          />
        </Dialog>
      </div>
      {agencies.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش وكالات لسه.
        </Card>
      ) : (
        agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} token={token} onDone={invalidate} />
        ))
      )}
    </div>
  );
}

function CreateAgencyDialog({ token, onDone }: { token: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم الوكالة مطلوب.");
      return;
    }
    setBusy(true);
    try {
      const created = await adminCreateAgency(token, {
        name: name.trim(),
        commissionRate: Number(commissionRate) || 0,
        contactEmail: contactEmail.trim() || null,
      });
      toast.success(`تم إنشاء الوكالة. رمز الدخول: ${created.accessToken}`);
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
        <DialogTitle>إضافة وكالة سياحة</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ag-name">اسم الوكالة</Label>
          <Input id="ag-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ag-commission">نسبة العمولة %</Label>
            <Input
              id="ag-commission"
              type="number"
              dir="ltr"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ag-email">إيميل التواصل (اختياري)</Label>
            <Input
              id="ag-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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

function AgencyCard({
  agency,
  token,
  onDone,
}: {
  agency: AdminAgencyRow;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await adminUpdateAgency(token, agency.id, {
        name: agency.name,
        commissionRate: agency.commissionRate,
        contactEmail: agency.contactEmail,
        isActive: !agency.isActive,
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
    if (!confirm(`متأكد إنك عايز تمسح "${agency.name}"؟`)) return;
    setBusy(true);
    try {
      await adminDeleteAgency(token, agency.id);
      toast.success("تم الحذف.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EntityCardShell
        title={agency.name}
        subtitle={`عمولة ${agency.commissionRate}%${agency.contactEmail ? ` · ${agency.contactEmail}` : ""}`}
        isActive={agency.isActive}
        accessToken={agency.accessToken}
        busy={busy}
        onToggleActive={toggleActive}
        onInvite={() => setInviteOpen(true)}
        onDelete={handleDelete}
        editDialog={
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                تعديل
              </Button>
            </DialogTrigger>
            <EditAgencyDialog
              agency={agency}
              token={token}
              onDone={() => {
                setEditOpen(false);
                onDone();
              }}
            />
          </Dialog>
        }
      />
      <InviteOwnerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        portalType="agency"
        entityId={agency.id}
        entityName={agency.name}
        defaultEmail={agency.contactEmail}
      />
    </>
  );
}

function EditAgencyDialog({
  agency,
  token,
  onDone,
}: {
  agency: AdminAgencyRow;
  token: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(agency.name);
  const [commissionRate, setCommissionRate] = useState(String(agency.commissionRate));
  const [contactEmail, setContactEmail] = useState(agency.contactEmail ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpdateAgency(token, agency.id, {
        name: name.trim(),
        commissionRate: Number(commissionRate) || 0,
        contactEmail: contactEmail.trim() || null,
        isActive: agency.isActive,
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
        <DialogTitle>تعديل {agency.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-ag-name">اسم الوكالة</Label>
          <Input id="edit-ag-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-ag-commission">نسبة العمولة %</Label>
            <Input
              id="edit-ag-commission"
              type="number"
              dir="ltr"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ag-email">إيميل التواصل</Label>
            <Input
              id="edit-ag-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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

// ===================== شركاء الطيران =====================

function AirlinePartnersTab() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ["admin-airline-partners", token],
    queryFn: () => adminListAirlinePartners(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (query.isPending) return <AdminLoading />;
  if (query.isError) {
    return isAdminAuthError(query.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const partners = query.data ?? [];
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-airline-partners", token] });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{partners.length} شريك</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              إضافة شريك طيران
            </Button>
          </DialogTrigger>
          <CreateAirlinePartnerDialog
            token={token}
            onDone={() => {
              setCreateOpen(false);
              invalidate();
            }}
          />
        </Dialog>
      </div>
      {partners.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش شركاء طيران لسه.
        </Card>
      ) : (
        partners.map((partner) => (
          <AirlinePartnerCard
            key={partner.id}
            partner={partner}
            token={token}
            onDone={invalidate}
          />
        ))
      )}
    </div>
  );
}

function CreateAirlinePartnerDialog({ token, onDone }: { token: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [commissionRate, setCommissionRate] = useState("25");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم الشريك مطلوب.");
      return;
    }
    setBusy(true);
    try {
      const created = await adminCreateAirlinePartner(token, {
        name: name.trim(),
        commissionRate: (Number(commissionRate) || 0) / 100,
        contactEmail: contactEmail.trim() || null,
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
        <DialogTitle>إضافة شريك طيران</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ap-name">اسم الشريك</Label>
          <Input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ap-commission">نسبة العمولة %</Label>
            <Input
              id="ap-commission"
              type="number"
              dir="ltr"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-email">إيميل التواصل (اختياري)</Label>
            <Input
              id="ap-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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

function AirlinePartnerCard({
  partner,
  token,
  onDone,
}: {
  partner: AdminAirlinePartnerRow;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await adminUpdateAirlinePartner(token, partner.id, {
        name: partner.name,
        commissionRate: partner.commissionRate,
        contactEmail: partner.contactEmail,
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
      await adminDeleteAirlinePartner(token, partner.id);
      toast.success("تم الحذف.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EntityCardShell
        title={partner.name}
        subtitle={`عمولة ${(partner.commissionRate * 100).toFixed(0)}%${partner.contactEmail ? ` · ${partner.contactEmail}` : ""}`}
        isActive={partner.isActive}
        accessToken={partner.accessToken}
        busy={busy}
        onToggleActive={toggleActive}
        onInvite={() => setInviteOpen(true)}
        onDelete={handleDelete}
        editDialog={
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                تعديل
              </Button>
            </DialogTrigger>
            <EditAirlinePartnerDialog
              partner={partner}
              token={token}
              onDone={() => {
                setEditOpen(false);
                onDone();
              }}
            />
          </Dialog>
        }
      />
      <InviteOwnerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        portalType="partner"
        entityId={partner.id}
        entityName={partner.name}
        defaultEmail={partner.contactEmail}
      />
    </>
  );
}

function EditAirlinePartnerDialog({
  partner,
  token,
  onDone,
}: {
  partner: AdminAirlinePartnerRow;
  token: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(partner.name);
  const [commissionRate, setCommissionRate] = useState(String(partner.commissionRate * 100));
  const [contactEmail, setContactEmail] = useState(partner.contactEmail ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpdateAirlinePartner(token, partner.id, {
        name: name.trim(),
        commissionRate: (Number(commissionRate) || 0) / 100,
        contactEmail: contactEmail.trim() || null,
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
          <Label htmlFor="edit-ap-name">اسم الشريك</Label>
          <Input id="edit-ap-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-ap-commission">نسبة العمولة %</Label>
            <Input
              id="edit-ap-commission"
              type="number"
              dir="ltr"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ap-email">إيميل التواصل</Label>
            <Input
              id="edit-ap-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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

// ===================== شركات النقل (operators) =====================

const PAYOUT_MODELS = [
  { value: "fixed_per_trip", label: "مبلغ ثابت للرحلة" },
  { value: "percentage", label: "نسبة من قيمة الرحلة" },
  { value: "per_seat", label: "مبلغ لكل مقعد" },
] as const;

function OperatorsTab() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ["admin-operators-full", token],
    queryFn: () => adminListOperatorsFull(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;
  if (query.isPending) return <AdminLoading />;
  if (query.isError) {
    return isAdminAuthError(query.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const operators = query.data ?? [];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-operators-full", token] });
    // القائمة المختصرة (id/name) المستخدمة في صفحات تعيين السائقين/العربيات
    queryClient.invalidateQueries({ queryKey: ["admin-operators", token] });
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{operators.length} شركة نقل</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              إضافة شركة نقل
            </Button>
          </DialogTrigger>
          <CreateOperatorDialog
            token={token}
            onDone={() => {
              setCreateOpen(false);
              invalidate();
            }}
          />
        </Dialog>
      </div>
      {operators.length === 0 ? (
        <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          مفيش شركات نقل لسه.
        </Card>
      ) : (
        operators.map((operator) => (
          <OperatorCard key={operator.id} operator={operator} token={token} onDone={invalidate} />
        ))
      )}
    </div>
  );
}

function PayoutFields({
  payoutModel,
  setPayoutModel,
  fixedAmount,
  setFixedAmount,
  percentageRate,
  setPercentageRate,
  perSeatAmount,
  setPerSeatAmount,
}: {
  payoutModel: string;
  setPayoutModel: (v: string) => void;
  fixedAmount: string;
  setFixedAmount: (v: string) => void;
  percentageRate: string;
  setPercentageRate: (v: string) => void;
  perSeatAmount: string;
  setPerSeatAmount: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="op-payout-model">طريقة احتساب المستحقات</Label>
      <select
        id="op-payout-model"
        value={payoutModel}
        onChange={(e) => setPayoutModel(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        {PAYOUT_MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      {payoutModel === "fixed_per_trip" && (
        <Input
          type="number"
          dir="ltr"
          placeholder="مبلغ ثابت ($)"
          value={fixedAmount}
          onChange={(e) => setFixedAmount(e.target.value)}
        />
      )}
      {payoutModel === "percentage" && (
        <Input
          type="number"
          dir="ltr"
          placeholder="نسبة %"
          value={percentageRate}
          onChange={(e) => setPercentageRate(e.target.value)}
        />
      )}
      {payoutModel === "per_seat" && (
        <Input
          type="number"
          dir="ltr"
          placeholder="مبلغ لكل مقعد ($)"
          value={perSeatAmount}
          onChange={(e) => setPerSeatAmount(e.target.value)}
        />
      )}
    </div>
  );
}

function CreateOperatorDialog({ token, onDone }: { token: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [payoutModel, setPayoutModel] = useState("fixed_per_trip");
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentageRate, setPercentageRate] = useState("");
  const [perSeatAmount, setPerSeatAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم شركة النقل مطلوب.");
      return;
    }
    setBusy(true);
    try {
      const created = await adminCreateOperator(token, {
        name: name.trim(),
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        payoutModel,
        fixedAmountUsd: payoutModel === "fixed_per_trip" ? Number(fixedAmount) || null : null,
        percentageRate: payoutModel === "percentage" ? Number(percentageRate) || null : null,
        perSeatAmountUsd: payoutModel === "per_seat" ? Number(perSeatAmount) || null : null,
      });
      toast.success(`تم إنشاء شركة النقل. رمز الدخول: ${created.accessToken}`);
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
        <DialogTitle>إضافة شركة نقل</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="op-name">اسم شركة النقل</Label>
          <Input id="op-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="op-phone">تليفون التواصل (اختياري)</Label>
            <Input
              id="op-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="op-email">إيميل التواصل (اختياري)</Label>
            <Input
              id="op-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
        <PayoutFields
          payoutModel={payoutModel}
          setPayoutModel={setPayoutModel}
          fixedAmount={fixedAmount}
          setFixedAmount={setFixedAmount}
          percentageRate={percentageRate}
          setPercentageRate={setPercentageRate}
          perSeatAmount={perSeatAmount}
          setPerSeatAmount={setPerSeatAmount}
        />
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

function OperatorCard({
  operator,
  token,
  onDone,
}: {
  operator: AdminOperatorRow;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await adminUpdateOperator(token, operator.id, {
        name: operator.name,
        contactPhone: operator.contactPhone,
        contactEmail: operator.contactEmail,
        payoutModel: operator.payoutModel,
        fixedAmountUsd: operator.fixedAmountUsd,
        percentageRate: operator.percentageRate,
        perSeatAmountUsd: operator.perSeatAmountUsd,
        isActive: !operator.isActive,
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
    if (!confirm(`متأكد إنك عايز تمسح "${operator.name}"؟`)) return;
    setBusy(true);
    try {
      await adminDeleteOperator(token, operator.id);
      toast.success("تم الحذف.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  const payoutSummary =
    operator.payoutModel === "fixed_per_trip"
      ? `${payoutModelLabel(operator.payoutModel)}${operator.fixedAmountUsd != null ? ` (${operator.fixedAmountUsd}$)` : ""}`
      : operator.payoutModel === "percentage"
        ? `${payoutModelLabel(operator.payoutModel)}${operator.percentageRate != null ? ` (${operator.percentageRate}%)` : ""}`
        : `${payoutModelLabel(operator.payoutModel)}${operator.perSeatAmountUsd != null ? ` (${operator.perSeatAmountUsd}$)` : ""}`;

  return (
    <>
      <EntityCardShell
        title={operator.name}
        subtitle={`${payoutSummary}${operator.contactPhone ? ` · ${operator.contactPhone}` : ""}${operator.contactEmail ? ` · ${operator.contactEmail}` : ""}`}
        isActive={operator.isActive}
        accessToken={operator.accessToken}
        busy={busy}
        onToggleActive={toggleActive}
        onInvite={() => setInviteOpen(true)}
        onDelete={handleDelete}
        editDialog={
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                تعديل
              </Button>
            </DialogTrigger>
            <EditOperatorDialog
              operator={operator}
              token={token}
              onDone={() => {
                setEditOpen(false);
                onDone();
              }}
            />
          </Dialog>
        }
      />
      <InviteOwnerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        portalType="operator"
        entityId={operator.id}
        entityName={operator.name}
        defaultEmail={operator.contactEmail}
      />
    </>
  );
}

function EditOperatorDialog({
  operator,
  token,
  onDone,
}: {
  operator: AdminOperatorRow;
  token: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(operator.name);
  const [contactPhone, setContactPhone] = useState(operator.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(operator.contactEmail ?? "");
  const [payoutModel, setPayoutModel] = useState(operator.payoutModel);
  const [fixedAmount, setFixedAmount] = useState(
    operator.fixedAmountUsd != null ? String(operator.fixedAmountUsd) : "",
  );
  const [percentageRate, setPercentageRate] = useState(
    operator.percentageRate != null ? String(operator.percentageRate) : "",
  );
  const [perSeatAmount, setPerSeatAmount] = useState(
    operator.perSeatAmountUsd != null ? String(operator.perSeatAmountUsd) : "",
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpdateOperator(token, operator.id, {
        name: name.trim(),
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        payoutModel,
        fixedAmountUsd: payoutModel === "fixed_per_trip" ? Number(fixedAmount) || null : null,
        percentageRate: payoutModel === "percentage" ? Number(percentageRate) || null : null,
        perSeatAmountUsd: payoutModel === "per_seat" ? Number(perSeatAmount) || null : null,
        isActive: operator.isActive,
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
        <DialogTitle>تعديل {operator.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-op-name">اسم شركة النقل</Label>
          <Input id="edit-op-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-op-phone">تليفون التواصل</Label>
            <Input
              id="edit-op-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-op-email">إيميل التواصل</Label>
            <Input
              id="edit-op-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
        <PayoutFields
          payoutModel={payoutModel}
          setPayoutModel={setPayoutModel}
          fixedAmount={fixedAmount}
          setFixedAmount={setFixedAmount}
          percentageRate={percentageRate}
          setPercentageRate={setPercentageRate}
          perSeatAmount={perSeatAmount}
          setPerSeatAmount={setPerSeatAmount}
        />
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
