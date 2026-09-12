import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useState } from "react";
import { toast } from "sonner";

import {
  PartnerAuthError,
  PartnerSection,
  PartnerTableSkeleton,
  PartnerTempError,
} from "@/components/partner/partner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatPartnerMoney,
  getPartnerDashboard,
  getPartnerSubscriptions,
  isoDaysAgo,
  isPartnerAuthError,
  subscriptionStatusLabel,
  todayIso,
} from "@/lib/partner";
import {
  createSubscriptionSafe,
  fetchSubscriptionPlans,
  formatUsd,
  friendlyErrorMessage,
  type SubscriptionPlan,
} from "@/lib/goair";

export const Route = createFileRoute("/partner/subscriptions")({
  head: () => ({
    meta: [
      { title: "اشتراكات العملاء — لوحة الوكالة" },
      { name: "description", content: "بيع اشتراك لعميلك مباشرة، معزوّ تلقائيًا لعمولة وكالتك — مصدر دخل منفصل عن حجوزات الرحلات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerSubscriptionsPage,
});

function PartnerSubscriptionsPage() {
  const token = usePartnerToken();
  if (!token) return <PartnerAuthError />;
  return <SubscriptionsInner token={token} />;
}

function SubscriptionsInner({ token }: { token: string }) {
  const dashboardQuery = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
  });

  const plansQuery = useQuery({ queryKey: ["goair", "subscription-plans"], queryFn: () => fetchSubscriptionPlans() });

  const [planId, setPlanId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; total: number } | null>(null);

  const [range, setRange] = useState({ from: isoDaysAgo(90), to: todayIso() });
  const [applied, setApplied] = useState({ from: isoDaysAgo(90), to: todayIso() });

  const listQuery = useQuery({
    queryKey: ["partner-subscriptions", token, applied.from, applied.to],
    queryFn: () => getPartnerSubscriptions(token, applied.from || null, applied.to || null),
    retry: false,
  });

  const plans = plansQuery.data ?? [];
  const selectedPlan = plans.find((p) => p.id === planId);

  if (dashboardQuery.isPending) return null;
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return isPartnerAuthError(dashboardQuery.error) ? <PartnerAuthError /> : <PartnerTempError />;
  }
  const referralCode = dashboardQuery.data.referralCode;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedPlan) {
      toast.error("اختار باقة الاشتراك الأول.");
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      toast.error("اكتب اسم العميل ورقم تليفونه.");
      return;
    }
    setBusy(true);
    try {
      const { subscriptionCode, expectedTotalUsd } = await createSubscriptionSafe({
        planId: selectedPlan.id,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        referralCodeOverride: referralCode,
      });
      setResult({ code: subscriptionCode, total: expectedTotalUsd });
      toast.success("تم إنشاء الاشتراك — الخطوة الجاية الدفع.");
      listQuery.refetch();
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من إنشاء الاشتراك."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PartnerSection
        title="بيع اشتراك لعميلك"
        description="مصدر دخل منفصل عن حجوزات الرحلات — بيتسجل معزوّ لعمولة وكالتك تلقائيًا."
      >
        {result ? (
          <div>
            <p className="text-sm text-muted-foreground">
              كود الاشتراك: <span className="font-display text-lg font-extrabold text-primary">{result.code}</span>
              {" — "}
              <span className="font-bold text-accent">{formatUsd(result.total)}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              العميل ممكن يكمّل دفع الاشتراك بكود الاشتراك ده من صفحة الدفع، أو تبعتله بنفسك.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => setResult(null)}>
              اشتراك جديد
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="باقة الاشتراك">
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder={plansQuery.isFetching ? "جاري التحميل..." : "اختار الباقة"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p: SubscriptionPlan) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.country} — {formatUsd(p.priceUsd)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="اسم العميل">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" />
            </Field>

            <Field label="رقم تليفون العميل">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
            </Field>

            {selectedPlan ? (
              <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3 text-sm sm:col-span-2">
                <span className="font-bold text-primary">سعر الاشتراك: </span>
                <span className="font-bold text-accent">{formatUsd(selectedPlan.priceUsd)}</span>
                {selectedPlan.freeRideCredits > 0 ? (
                  <span className="mr-1 text-xs text-muted-foreground"> — شامل {selectedPlan.freeRideCredits} رحلة مجانية</span>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={busy}
              className="sm:col-span-2 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {busy ? "جاري الإنشاء..." : "إنشاء الاشتراك"}
            </Button>
          </form>
        )}
      </PartnerSection>

      <PartnerSection title="الاشتراكات اللي بعتها">
        <form
          className="mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(range);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ps-from">من تاريخ</Label>
            <Input
              id="ps-from"
              type="date"
              value={range.from}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-to">إلى تاريخ</Label>
            <Input
              id="ps-to"
              type="date"
              value={range.to}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
            />
          </div>
          <Button type="submit" className="h-10 bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            تحديث
          </Button>
        </form>

        {listQuery.isPending ? (
          <PartnerTableSkeleton rows={4} cols={6} />
        ) : listQuery.isError ? (
          isPartnerAuthError(listQuery.error) ? <PartnerAuthError /> : <PartnerTempError />
        ) : (listQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش اشتراكات في الفترة المحددة.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">تاريخ البيع</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">تليفون العميل</TableHead>
                  <TableHead className="text-right">الباقة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">العمولة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                    <TableCell className="font-semibold text-primary">{row.fullName}</TableCell>
                    <TableCell dir="ltr" className="text-right">{row.phoneNumber}</TableCell>
                    <TableCell>{row.planName}</TableCell>
                    <TableCell>{subscriptionStatusLabel(row.status)}</TableCell>
                    <TableCell>{formatPartnerMoney(row.expectedTotalUsd)}</TableCell>
                    <TableCell className="font-bold text-accent">{formatPartnerMoney(row.commissionUsd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PartnerSection>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
