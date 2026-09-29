import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminToken } from "@/lib/admin-session";
import {
  adminListAirlineContracts,
  adminListContractPartners,
  adminSaveAirlineContract,
  adminSaveContractRateLine,
  isAdminAuthError,
  type AdminContract,
  type AdminContractLine,
  type AdminContractPartner,
  type ContractBillingCycle,
  type ContractPayerModel,
  type ContractPricingBasis,
  type ContractStatus,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({ meta: [{ title: "العقود — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: ContractsPage,
});

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "مسودة",
  active: "فعّال",
  suspended: "موقوف",
  expired: "منتهي",
  terminated: "ملغي",
};
const PAYER_LABELS: Record<ContractPayerModel, string> = {
  passenger_direct: "الراكب يدفع لـGoAir مباشرة",
  airline_pays: "شركة الطيران تدفع عن الراكب",
  passenger_via_ticket: "الراكب يدفع مع التذكرة (الشركة تسدّد)",
};
const BILLING_LABELS: Record<ContractBillingCycle, string> = {
  weekly: "أسبوعي",
  biweekly: "كل أسبوعين",
  monthly: "شهري",
  per_trip: "لكل رحلة",
};
const BASIS_LABELS: Record<ContractPricingBasis, string> = {
  per_vehicle: "بالعربية (سعر ثابت)",
  per_passenger: "بالراكب",
  tiered: "شرائح حسب الحجم",
};
const CURRENCIES = ["EGP", "USD", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "YER", "BDT"];
const VEHICLES = ["car", "van", "hiace", "bus"];
const ANY = "any";

const STATUS_VARIANT: Record<ContractStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  active: "default",
  suspended: "secondary",
  expired: "secondary",
  terminated: "destructive",
};

function num(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function describeLine(l: AdminContractLine, currency: string) {
  if (l.pricingBasis === "tiered") {
    return l.tiers.map((t) => `من ${t.fromQty}: ${t.unitPrice}`).join(" • ");
  }
  const base = `${l.unitPrice} ${currency}${l.pricingBasis === "per_passenger" ? " / راكب" : " / عربية"}`;
  return l.capPerVehicleTrip != null ? `${base} (سقف ${l.capPerVehicleTrip})` : base;
}

function ContractsPage() {
  const token = useAdminToken();
  const qc = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ["admin-airline-contracts", token],
    queryFn: () => adminListAirlineContracts(token),
    retry: false,
    enabled: Boolean(token),
  });
  const partnersQuery = useQuery({
    queryKey: ["admin-contract-partners", token],
    queryFn: () => adminListContractPartners(token),
    retry: false,
    enabled: Boolean(token),
  });

  const [contractDialog, setContractDialog] = useState<{ contract: AdminContract | null } | null>(null);
  const [lineDialog, setLineDialog] = useState<{ contract: AdminContract; line: AdminContractLine | null } | null>(null);

  if (!token) return null;
  if (contractsQuery.isPending || partnersQuery.isPending) return <AdminLoading />;
  if (contractsQuery.isError || partnersQuery.isError) {
    const err = contractsQuery.error ?? partnersQuery.error;
    return isAdminAuthError(err) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message={err instanceof Error ? err.message : "حصل خطأ مؤقت."} />
    );
  }

  const contracts = contractsQuery.data ?? [];
  const partners = partnersQuery.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-airline-contracts"] });

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">عقود شركات الطيران</h1>
          <p className="text-sm text-muted-foreground">
            تسجيل العقد والأسعار المتفق عليها. لسه الحجز ما بيقراش العقد تلقائيًا.
          </p>
        </div>
        <Button onClick={() => setContractDialog({ contract: null })} disabled={partners.length === 0}>
          عقد جديد
        </Button>
      </div>

      {partners.length === 0 && (
        <Card className="p-4 text-sm text-muted-foreground">مفيش شركة طيران مسجّلة. ضيف شركة من صفحة الوكالات والشركاء الأول.</Card>
      )}
      {contracts.length === 0 && partners.length > 0 && (
        <Card className="p-8 text-center text-muted-foreground">لسه مفيش عقود. اضغط "عقد جديد".</Card>
      )}

      {contracts.map((c) => (
        <Card key={c.id} className="space-y-4 rounded-xl border-border/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold">{c.partnerName}</span>
                <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {c.contractRef} • من {c.effectiveFrom}
                {c.effectiveTo ? ` إلى ${c.effectiveTo}` : " (مفتوح)"}
              </p>
              <p className="text-sm">
                {PAYER_LABELS[c.payerModel]} • {c.currency} • فوترة {BILLING_LABELS[c.billingCycle]} • سداد خلال{" "}
                {c.paymentTermsDays} يوم
              </p>
              {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setContractDialog({ contract: c })}>
                تعديل العقد
              </Button>
              <Button
                size="sm"
                disabled={c.status === "expired" || c.status === "terminated"}
                onClick={() => setLineDialog({ contract: c, line: null })}
              >
                إضافة سعر
              </Button>
            </div>
          </div>

          {c.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش أسعار في العقد ده لسه.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المطار</TableHead>
                    <TableHead>المركبة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>أساس التسعير</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>حد أدنى شهري</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.airportCode}</TableCell>
                      <TableCell>{l.vehicleCode ?? "الكل"}</TableCell>
                      <TableCell>{l.bookingType ?? "الكل"}</TableCell>
                      <TableCell>{BASIS_LABELS[l.pricingBasis]}</TableCell>
                      <TableCell>{describeLine(l, c.currency)}</TableCell>
                      <TableCell>{l.minMonthlyAmount ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={c.status === "expired" || c.status === "terminated"}
                          onClick={() => setLineDialog({ contract: c, line: l })}
                        >
                          تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ))}

      {contractDialog && (
        <ContractDialog
          token={token}
          partners={partners}
          contract={contractDialog.contract}
          onClose={() => setContractDialog(null)}
          onSaved={() => {
            setContractDialog(null);
            refresh();
          }}
        />
      )}
      {lineDialog && (
        <LineDialog
          token={token}
          contract={lineDialog.contract}
          line={lineDialog.line}
          onClose={() => setLineDialog(null)}
          onSaved={() => {
            setLineDialog(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function ContractDialog({
  token,
  partners,
  contract,
  onClose,
  onSaved,
}: {
  token: string;
  partners: AdminContractPartner[];
  contract: AdminContract | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [partnerId, setPartnerId] = useState(contract?.partnerId ?? partners[0]?.id ?? "");
  const [contractRef, setContractRef] = useState(contract?.contractRef ?? "");
  const [status, setStatus] = useState<ContractStatus>(contract?.status ?? "draft");
  const [from, setFrom] = useState(contract?.effectiveFrom ?? new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(contract?.effectiveTo ?? "");
  const [currency, setCurrency] = useState(contract?.currency ?? "EGP");
  const [payer, setPayer] = useState<ContractPayerModel>(contract?.payerModel ?? "airline_pays");
  const [billing, setBilling] = useState<ContractBillingCycle>(contract?.billingCycle ?? "monthly");
  const [terms, setTerms] = useState(String(contract?.paymentTermsDays ?? 30));
  const [notes, setNotes] = useState(contract?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!contractRef.trim()) {
      toast.error("اكتب رقم العقد");
      return;
    }
    setSaving(true);
    try {
      await adminSaveAirlineContract(token, {
        id: contract?.id ?? null,
        partnerId,
        contractRef: contractRef.trim(),
        status,
        effectiveFrom: from,
        effectiveTo: to || null,
        currency,
        payerModel: payer,
        billingCycle: billing,
        paymentTermsDays: Number(terms) || 0,
        notes: notes.trim() || null,
      });
      toast.success("اتحفظ العقد");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contract ? "تعديل العقد" : "عقد جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="شركة الطيران">
            <Select value={partnerId} onValueChange={setPartnerId} disabled={Boolean(contract)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.airlineCode ? ` (${p.airlineCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="رقم العقد">
            <Input value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder="مثال: MS-2026-001" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="بداية العقد">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="نهاية العقد (اختياري)">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="العملة">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="الحالة">
              <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as ContractStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="مين بيدفع">
            <Select value={payer} onValueChange={(v) => setPayer(v as ContractPayerModel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYER_LABELS) as ContractPayerModel[]).map((p) => (
                  <SelectItem key={p} value={p}>{PAYER_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="دورة الفوترة">
              <Select value={billing} onValueChange={(v) => setBilling(v as ContractBillingCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILLING_LABELS) as ContractBillingCycle[]).map((b) => (
                    <SelectItem key={b} value={b}>{BILLING_LABELS[b]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="آجال السداد (أيام)">
              <Input type="number" min={0} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </Field>
          </div>
          <Field label="ملاحظات">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <p className="text-xs text-muted-foreground">
            العقد ما ينفعش يتفعّل غير لما يبقى فيه سطر سعر واحد على الأقل.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>{saving ? "بيحفظ..." : "حفظ"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LineDialog({
  token,
  contract,
  line,
  onClose,
  onSaved,
}: {
  token: string;
  contract: AdminContract;
  line: AdminContractLine | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [airport, setAirport] = useState(line?.airportCode ?? "");
  const [vehicle, setVehicle] = useState(line?.vehicleCode ?? ANY);
  const [bookingType, setBookingType] = useState(line?.bookingType ?? ANY);
  const [basis, setBasis] = useState<ContractPricingBasis>(line?.pricingBasis ?? "per_passenger");
  const [price, setPrice] = useState(line?.unitPrice != null ? String(line.unitPrice) : "");
  const [cap, setCap] = useState(line?.capPerVehicleTrip != null ? String(line.capPerVehicleTrip) : "");
  const [minMonthly, setMinMonthly] = useState(line?.minMonthlyAmount != null ? String(line.minMonthlyAmount) : "");
  const [from, setFrom] = useState(line?.validFrom ?? new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(line?.validTo ?? "");
  const [tiers, setTiers] = useState<{ from: string; price: string }[]>(
    line && line.tiers.length > 0
      ? line.tiers.map((t) => ({ from: String(t.fromQty), price: String(t.unitPrice) }))
      : [{ from: "0", price: "" }],
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!airport.trim()) {
      toast.error("اكتب كود المطار");
      return;
    }
    if (basis !== "tiered" && num(price) == null) {
      toast.error("اكتب السعر");
      return;
    }
    const parsedTiers = tiers.map((t) => ({ fromQty: Number(t.from), unitPrice: Number(t.price) }));
    if (basis === "tiered" && parsedTiers.some((t) => !Number.isFinite(t.fromQty) || !Number.isFinite(t.unitPrice) || t.unitPrice < 0)) {
      toast.error("راجع بيانات الشرائح");
      return;
    }
    setSaving(true);
    try {
      await adminSaveContractRateLine(token, {
        id: line?.id ?? null,
        contractId: contract.id,
        airportCode: airport.trim().toUpperCase(),
        hubId: line?.hubId ?? null,
        bookingType: bookingType === ANY ? null : bookingType,
        vehicleCode: vehicle === ANY ? null : vehicle,
        pricingBasis: basis,
        unitPrice: basis === "tiered" ? null : num(price),
        capPerVehicleTrip: basis === "per_passenger" ? num(cap) : null,
        minMonthlyAmount: num(minMonthly),
        validFrom: from || null,
        validTo: to || null,
        tiers: basis === "tiered" ? parsedTiers : null,
      });
      toast.success("اتحفظ السعر");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{line ? "تعديل سعر" : "إضافة سعر"} — {contract.contractRef}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="كود المطار">
              <Input value={airport} onChange={(e) => setAirport(e.target.value)} placeholder="CAI" />
            </Field>
            <Field label="المركبة">
              <Select value={vehicle} onValueChange={setVehicle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>الكل</SelectItem>
                  {VEHICLES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="نوع الحجز">
            <Select value={bookingType} onValueChange={setBookingType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>الكل</SelectItem>
                <SelectItem value="shared">مشترك</SelectItem>
                <SelectItem value="private">خاص</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="أساس التسعير">
            <Select value={basis} onValueChange={(v) => setBasis(v as ContractPricingBasis)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(BASIS_LABELS) as ContractPricingBasis[]).map((b) => (
                  <SelectItem key={b} value={b}>{BASIS_LABELS[b]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {basis !== "tiered" && (
            <Field label={`السعر (${contract.currency}) ${basis === "per_passenger" ? "للراكب" : "للعربية"}`}>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          )}
          {basis === "per_passenger" && (
            <Field label="سقف لسعر العربية الكاملة (اختياري)">
              <Input type="number" min={0} value={cap} onChange={(e) => setCap(e.target.value)} />
            </Field>
          )}
          {basis === "tiered" && (
            <div className="space-y-2">
              <span className="text-sm font-medium">الشرائح (سعر الراكب حسب الحجم الشهري)</span>
              {tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="من عدد ركاب"
                    value={t.from}
                    onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="سعر الراكب"
                    value={t.price}
                    onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={tiers.length === 1}
                    onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                  >
                    حذف
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setTiers([...tiers, { from: "", price: "" }])}>
                إضافة شريحة
              </Button>
              <p className="text-xs text-muted-foreground">أول شريحة لازم تبدأ من 0.</p>
            </div>
          )}

          <Field label="حد أدنى شهري (اختياري)">
            <Input type="number" min={0} value={minMonthly} onChange={(e) => setMinMonthly(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ساري من">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="ساري حتى (اختياري)">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>{saving ? "بيحفظ..." : "حفظ"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
