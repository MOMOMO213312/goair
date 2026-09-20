import { createFileRoute, Link } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarCheck,
  Check,
  Copy,
  Loader2,
  PlaneTakeoff,
  Star,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FlightPath } from "@/components/flight-path";
import {
  BookingStatusBadge,
  PartnerAuthError,
  PartnerOverviewSkeleton,
  PartnerSection,
  PartnerTempError,
} from "@/components/partner/partner-shell";
import { ListRow, PageHeader, PortalCard, StatCard, StatusPill } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/goair";
import {
  formatPartnerMoney,
  getPartnerBookings,
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
  const recentQuery = useQuery({
    queryKey: ["partner-recent-bookings", token],
    queryFn: () => getPartnerBookings(token, null, null),
    retry: false,
  });

  if (query.isPending) return <PartnerOverviewSkeleton />;
  if (query.isError || !query.data) {
    return isPartnerAuthError(query.error) ? <PartnerAuthError /> : <PartnerTempError />;
  }

  const data = query.data;
  const referralLink = data.referralCode ? getPartnerReferralUrl(data.referralCode) : null;
  const recent = [...(recentQuery.data ?? [])]
    .sort((a, b) => (b.bookedAt ?? "").localeCompare(a.bookedAt ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`أهلاً، ${data.partnerName}`}
        subtitle="ملخص نشاطك على GoAir"
        actions={
          <div className="flex items-center gap-3">
            {data.logoUrl && data.brandApproved ? (
              <img src={data.logoUrl} alt="" className="h-9 w-auto max-w-32 object-contain" loading="lazy" />
            ) : null}
            <StatusPill tone={data.brandApproved ? "success" : "warning"}>
              {data.brandApproved ? "الهوية معتمدة" : "الهوية قيد المراجعة"}
            </StatusPill>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="الحجوزات هذا الشهر" value={String(data.currentMonthBookings)} />
        <StatCard
          highlight
          icon={Wallet}
          label="العمولة المستحقة"
          value={formatPartnerMoney(data.currentMonthCommissionDueUsd)}
          hint={data.commissionRate ? `نسبة العمولة ${data.commissionRate}%` : undefined}
        />
        <StatCard icon={Ticket} label="إجمالي الحجوزات" value={String(data.lifetimeBookings)} />
        <StatCard
          icon={Star}
          label="متوسط التقييم"
          value={
            data.ratingsCount === 0
              ? "لسه مفيش تقييمات"
              : `${(data.averageRating ?? 0).toFixed(1)} من 5`
          }
          hint={data.ratingsCount === 0 ? undefined : `${data.ratingsCount} تقييم`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalCard
          title="آخر الحجوزات"
          action={
            <Link to="/partner/bookings" className="text-sm font-bold text-[var(--portal-accent)] hover:underline">
              عرض الكل
            </Link>
          }
        >
          {recentQuery.isPending ? (
            <p className="text-sm text-slate-500">جاري التحميل...</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-slate-500">لسه مفيش حجوزات. ابدأ بـ «احجز لعميل».</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((booking) => (
                <ListRow
                  key={booking.id}
                  title={`${booking.origin} ← ${booking.destination}`}
                  subtitle={`${booking.fullName} · ${booking.seatsCount} راكب${booking.travelDate ? ` · ${booking.travelDate}` : ""}`}
                  end={<BookingStatusBadge status={booking.status} />}
                />
              ))}
            </ul>
          )}
        </PortalCard>

        <PartnerSection title="رابط GoAir الخاص بك" description="شارك الرابط مع مسافريك عبر قنواتك.">
          {referralLink ? (
            <div className="flex flex-col gap-3">
              <code className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm font-semibold text-primary break-all">
                {referralLink}
              </code>
              <Button
                type="button"
                variant="outline"
                className="w-fit shrink-0 font-bold"
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
