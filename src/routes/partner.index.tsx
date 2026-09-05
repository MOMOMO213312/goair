import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Copy, Loader2, PlaneTakeoff, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FlightPath } from "@/components/flight-path";
import {
  PartnerAuthError,
  PartnerOverviewSkeleton,
  PartnerSection,
  PartnerStatCard,
  PartnerTempError,
} from "@/components/partner/partner-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/goair";
import {
  formatPartnerMoney,
  getPartnerDashboard,
  getPartnerReferralUrl,
  isPartnerAuthError,
} from "@/lib/partner";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "لوحة الشركاء — GoAir" },
      {
        name: "description",
        content: "لوحة تحكم شركاء GoAir: الحجوزات، العمولات، وكشوف الحساب.",
      },
      { property: "og:title", content: "لوحة الشركاء — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerIndexPage,
});

function PartnerIndexPage() {
  const token = usePartnerToken();
  if (token) return <PartnerOverview token={token} />;
  return <PartnerPitch />;
}

function PartnerOverview({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
  });

  if (query.isPending) return <PartnerOverviewSkeleton />;
  if (query.isError || !query.data) {
    return isPartnerAuthError(query.error) ? <PartnerAuthError /> : <PartnerTempError />;
  }

  const data = query.data;
  const referralLink = data.referralCode ? getPartnerReferralUrl(data.referralCode) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PartnerStatCard label="الحجوزات هذا الشهر" value={String(data.currentMonthBookings)} />
        <PartnerStatCard
          highlight
          label="العمولة المستحقة"
          value={formatPartnerMoney(data.currentMonthCommissionDueUsd)}
          hint={data.commissionRate ? `نسبة العمولة ${data.commissionRate}%` : undefined}
        />
        <PartnerStatCard label="إجمالي الحجوزات" value={String(data.lifetimeBookings)} />
        <PartnerStatCard
          label="متوسط التقييم"
          value={
            data.ratingsCount === 0
              ? "لسه مفيش تقييمات"
              : `${(data.averageRating ?? 0).toFixed(1)} / 5`
          }
          hint={data.ratingsCount === 0 ? undefined : `${data.ratingsCount} تقييم`}
        />
      </div>

      <PartnerSection title="رابط GoAir الخاص بك" description="شارك الرابط مع مسافريك عبر قنواتك.">
        {referralLink ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm font-semibold text-primary break-all">
              {referralLink}
            </code>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 font-bold"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  toast.success("تم نسخ الرابط.");
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  toast.error("لم نتمكن من النسخ — انسخ الرابط يدويًا.");
                }
              }}
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              نسخ الرابط
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">رابط الإحالة هيظهر هنا بعد تفعيل حسابك.</p>
        )}
      </PartnerSection>
    </div>
  );
}

const benefits = [
  { icon: PlaneTakeoff, title: "تغطية التأخيرات", text: "متابعة أرقام الرحلات وانتظار مجاني لحد ساعة." },
  { icon: Users, title: "حلول سفر مخصصة", text: "خدمات مصممة حسب احتياج مسافريك ووجهتهم." },
  { icon: Building2, title: "تجربة وصول أفضل", text: "استقبال في صالة الوصول بلافتة عليها اسم راكبك." },
  { icon: TrendingUp, title: "تشغيل موثوق", text: "مواعيد ثابتة وتغطية مستمرة على مدار الساعة." },
];

function PartnerPitch() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("اكتب الاسم والبريد الإلكتروني.");
      return;
    }
    setBusy(true);
    try {
      await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: `[شراكة] ${form.message.trim()}`,
      });
      toast.success("وصلنا طلبك — فريق الشراكات هيتواصل معاك.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("لم نتمكن من إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg-primary px-4 py-16 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">برامج الشراكات</h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80">
            انضم كشريك طيران أو شركة سياحة وقدّم لمسافريك تجربة نقل مطار موثوقة عبر GoAir.
          </p>
          <FlightPath className="mt-6 h-8 w-full max-w-md text-accent" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map((item) => (
            <Card key={item.title} className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <item.icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-base font-bold text-primary">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10 rounded-xl border-border/80 p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-xl font-extrabold text-primary">اطلب عرض شراكة</h2>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-name">الاسم / الشركة</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">البريد الإلكتروني</Label>
                <Input
                  id="p-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-phone">رقم التواصل</Label>
              <Input
                id="p-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-msg">تفاصيل الطلب</Label>
              <Textarea
                id="p-msg"
                rows={4}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={busy}
              className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              إرسال الطلب
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
