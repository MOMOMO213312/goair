import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, MapPinned, ShieldCheck, TrendingUp, Users2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FlightPath } from "@/components/flight-path";
import {
  AgencyAuthError,
  AgencyOverviewSkeleton,
  AgencySection,
  AgencyStatCard,
  AgencyTempError,
} from "@/components/agency/agency-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatAgencyMoney,
  getAgencyDashboard,
  getAgencyReferralUrl,
  isAgencyAuthError,
} from "@/lib/agency";

export const Route = createFileRoute("/agency/")({
  head: () => ({
    meta: [
      { title: "لوحة وكالات السياحة — GoAir" },
      {
        name: "description",
        content: "لوحة تحكم وكالات السياحة الشريكة: الحجوزات، العمولات، وكشوف الحساب.",
      },
      { property: "og:title", content: "لوحة وكالات السياحة — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgencyIndexPage,
});

function AgencyIndexPage() {
  const { token } = Route.useSearch();
  if (token) return <AgencyOverview token={token} />;
  return <AgencyPitch />;
}

function AgencyOverview({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ["agency-dashboard", token],
    queryFn: () => getAgencyDashboard(token),
    retry: false,
  });

  if (query.isPending) return <AgencyOverviewSkeleton />;
  if (query.isError || !query.data) {
    return isAgencyAuthError(query.error) ? <AgencyAuthError /> : <AgencyTempError />;
  }

  const data = query.data;
  const referralLink = data.referralCode ? getAgencyReferralUrl(data.referralCode) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgencyStatCard label="الحجوزات هذا الشهر" value={String(data.currentMonthBookings)} />
        <AgencyStatCard
          label="قيمة تذاكر الشهر"
          value={formatAgencyMoney(data.currentMonthTicketValueUsd)}
        />
        <AgencyStatCard
          highlight
          label="العمولة المستحقة هذا الشهر"
          value={formatAgencyMoney(data.currentMonthCommissionDueUsd)}
          hint={data.commissionRate ? `نسبة العمولة ${(data.commissionRate * 100).toFixed(0)}%` : undefined}
        />
        <AgencyStatCard
          label="متوسط التقييم"
          value={
            data.ratingsCount === 0
              ? "لسه مفيش تقييمات"
              : `${(data.averageRating ?? 0).toFixed(1)} / 5`
          }
          hint={data.ratingsCount === 0 ? undefined : `${data.ratingsCount} تقييم`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AgencyStatCard label="إجمالي الحجوزات (كل الوقت)" value={String(data.lifetimeBookings)} />
        <AgencyStatCard
          label="إجمالي العمولة المستحقة (كل الوقت)"
          value={formatAgencyMoney(data.lifetimeCommissionDueUsd)}
        />
      </div>

      <AgencySection title="رابط GoAir الخاص بوكالتك" description="شارك الرابط مع عملائك عبر قنواتك.">
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
      </AgencySection>
    </div>
  );
}

const benefits = [
  { icon: TrendingUp, title: "عمولة على كل حجز", text: "اكسب نسبة من كل رحلة تحجزها لعملائك عبر GoAir." },
  { icon: Users2, title: "مناسب لأي حجم مجموعة", text: "من رحلة فردية لمجموعة سياحية كاملة." },
  { icon: ShieldCheck, title: "تجربة موثوقة لعملائك", text: "سعر ثابت، مواعيد معروفة، واستقبال بالاسم." },
  { icon: MapPinned, title: "تغطية مصر ولبنان", text: "أهم المطارات والوجهات في الدولتين." },
];

function AgencyPitch() {
  return (
    <>
      <div className="bg-primary px-4 py-16 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">شركاء وكالات السياحة</h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80">
            قدّم خدمة نقل المطار لعملائك عبر GoAir واكسب عمولة على كل حجز — من غير أي التزام بأسطول أو تشغيل.
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

        <Card className="mt-10 rounded-xl border-border/80 p-6 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-display text-xl font-extrabold text-primary">عايز تبقى وكالة شريكة؟</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            تواصل معنا وفريق الشراكات هيجهزلك حساب وكالتك ورابط العمولة الخاص بيك.
          </p>
          <Button asChild size="lg" className="mt-5 bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            <Link to="/partner">تواصل مع فريق الشراكات</Link>
          </Button>
        </Card>
      </div>
    </>
  );
}
