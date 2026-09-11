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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listGroundHandlingServices,
  createGroundHandlingService,
  updateGroundHandlingService,
  setGroundHandlingServicePause,
  requestGroundHandlingServiceDeletion,
  groundHandlingServiceStatusLabel,
  isGroundHandlingAuthError,
  type GroundHandlingService,
  type GroundHandlingServiceInput,
} from "@/lib/ground-handling";
import { useGroundHandlingSession, useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/services")({
  head: () => ({ meta: [{ title: "إدارة الخدمات — بوابة GOAIR للخدمات الأرضية" }] }),
  component: ServicesPage,
});

const STATUS_TONE: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-destructive/10 text-destructive",
  paused: "bg-muted text-muted-foreground",
  deletion_requested: "bg-destructive/10 text-destructive",
};

const emptyForm: GroundHandlingServiceInput = {
  name: "",
  description: "",
  requirements: "",
  airportCode: "",
  terminal: "",
  direction: null,
  operatingHoursStart: "",
  operatingHoursEnd: "",
  dailyCapacity: null,
  priceUsd: 0,
};

function ServicesPage() {
  const token = useGroundHandlingToken();
  const { signOut } = useGroundHandlingSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroundHandlingService | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["ground-handling-services", token],
    queryFn: () => listGroundHandlingServices(token as string),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ground-handling-services", token] });
  }

  if (servicesQuery.isError) {
    if (isGroundHandlingAuthError(servicesQuery.error)) signOut();
    return <GHAuthError message="حصل خطأ مؤقت. حاول تاني." />;
  }

  const services = servicesQuery.data ?? [];

  async function togglePause(service: GroundHandlingService) {
    try {
      await setGroundHandlingServicePause(token as string, service.id, service.status !== "paused");
      toast.success(service.status === "paused" ? "تم إرسال طلب استئناف الخدمة." : "تم إيقاف الخدمة مؤقتًا.");
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  async function requestDeletion(service: GroundHandlingService) {
    if (!confirm(`تأكيد طلب إلغاء خدمة "${service.name}"؟`)) return;
    try {
      await requestGroundHandlingServiceDeletion(token as string, service.id);
      toast.success("تم إرسال طلب إلغاء الخدمة إلى GOAIR للمراجعة.");
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="gap-1.5 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          إضافة خدمة جديدة
        </Button>
      </div>

      {servicesQuery.isPending ? (
        <GHLoading />
      ) : services.length === 0 ? (
        <GHEmpty>لسه معملتش خدمات. ابدأ بإضافة أول خدمة.</GHEmpty>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className="space-y-2 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-bold text-primary">{s.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {s.airportCode}
                    {s.terminal ? ` · ${s.terminal}` : ""}
                    {s.direction ? ` · ${s.direction === "arrival" ? "وصول" : "مغادرة"}` : ""}
                    {s.operatingHoursStart ? ` · ${s.operatingHoursStart}–${s.operatingHoursEnd}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-primary">${s.priceUsd.toFixed(2)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[s.status] ?? "bg-mist text-primary"}`}>
                  {groundHandlingServiceStatusLabel(s.status)}
                  {s.pendingAction ? " (قيد المراجعة)" : ""}
                </span>
              </div>
              {s.description ? <p className="text-sm text-muted-foreground">{s.description}</p> : null}
              {s.status === "rejected" && s.adminNotes ? (
                <p className="text-sm text-destructive">سبب الرفض: {s.adminNotes}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                  تعديل
                </Button>
                {s.status === "approved" || s.status === "paused" ? (
                  <Button size="sm" variant="outline" onClick={() => togglePause(s)}>
                    {s.status === "paused" ? "استئناف الخدمة" : "إيقاف مؤقت"}
                  </Button>
                ) : null}
                {s.status !== "deletion_requested" ? (
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => requestDeletion(s)}>
                    طلب إلغاء الخدمة
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormDialog
        token={token}
        open={dialogOpen}
        service={editing}
        onOpenChange={setDialogOpen}
        onSaved={invalidate}
      />
    </div>
  );
}

function ServiceFormDialog({
  token,
  open,
  service,
  onOpenChange,
  onSaved,
}: {
  token: string;
  open: boolean;
  service: GroundHandlingService | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<GroundHandlingServiceInput>(
    service
      ? {
          name: service.name,
          description: service.description ?? "",
          requirements: service.requirements ?? "",
          airportCode: service.airportCode,
          terminal: service.terminal ?? "",
          direction: service.direction,
          operatingHoursStart: service.operatingHoursStart ?? "",
          operatingHoursEnd: service.operatingHoursEnd ?? "",
          dailyCapacity: service.dailyCapacity,
          priceUsd: service.priceUsd,
        }
      : emptyForm,
  );
  const [busy, setBusy] = useState(false);

  // Reset the form whenever a different service (or "new") is opened.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const key = service?.id ?? "new";
  if (open && key !== openedFor) {
    setOpenedFor(key);
    setForm(
      service
        ? {
            name: service.name,
            description: service.description ?? "",
            requirements: service.requirements ?? "",
            airportCode: service.airportCode,
            terminal: service.terminal ?? "",
            direction: service.direction,
            operatingHoursStart: service.operatingHoursStart ?? "",
            operatingHoursEnd: service.operatingHoursEnd ?? "",
            dailyCapacity: service.dailyCapacity,
            priceUsd: service.priceUsd,
          }
        : emptyForm,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (service) {
        await updateGroundHandlingService(token, service.id, form);
        toast.success("تم إرسال التعديل إلى GOAIR للمراجعة.");
      } else {
        await createGroundHandlingService(token, form);
        toast.success("تم إرسال الخدمة إلى GOAIR للمراجعة.");
      }
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "تعديل خدمة" : "إضافة خدمة جديدة"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الخدمة</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>الوصف</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>المتطلبات</Label>
            <Textarea rows={2} value={form.requirements ?? ""} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>كود المطار</Label>
              <Input required value={form.airportCode} onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>Terminal</Label>
              <Input value={form.terminal ?? ""} onChange={(e) => setForm({ ...form, terminal: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الاتجاه</Label>
              <Select value={form.direction ?? "both"} onValueChange={(v) => setForm({ ...form, direction: v === "both" ? null : (v as "arrival" | "departure") })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">وصول ومغادرة</SelectItem>
                  <SelectItem value="arrival">وصول فقط</SelectItem>
                  <SelectItem value="departure">مغادرة فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الطاقة الاستيعابية اليومية</Label>
              <Input
                type="number"
                min={0}
                value={form.dailyCapacity ?? ""}
                onChange={(e) => setForm({ ...form, dailyCapacity: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>بداية ساعات العمل</Label>
              <Input type="time" value={form.operatingHoursStart ?? ""} onChange={(e) => setForm({ ...form, operatingHoursStart: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>نهاية ساعات العمل</Label>
              <Input type="time" value={form.operatingHoursEnd ?? ""} onChange={(e) => setForm({ ...form, operatingHoursEnd: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>التكلفة المتفق عليها مع GOAIR (دولار)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              required
              value={form.priceUsd}
              onChange={(e) => setForm({ ...form, priceUsd: Number(e.target.value) })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            أي إضافة أو تعديل يتم إرساله إلى GOAIR للمراجعة، ولن تصبح الخدمة متاحة للعملاء إلا بعد الموافقة.
          </p>
          <Button type="submit" disabled={busy} className="w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            {busy ? "جاري الإرسال..." : "إرسال للمراجعة"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
