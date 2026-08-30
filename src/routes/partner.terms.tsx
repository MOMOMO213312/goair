import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  PartnerAuthError,
  PartnerOverviewSkeleton,
  PartnerSection,
  PartnerTempError,
} from "@/components/partner/partner-shell";
import { getPartnerDashboard, isPartnerAuthError } from "@/lib/partner";

export const Route = createFileRoute("/partner/terms")({
  head: () => ({
    meta: [
      { title: "شروط الشراكة — GoAir" },
      { name: "description", content: "مستويات الخدمة المتفق عليها وحالة اعتماد الشعار." },
      { property: "og:title", content: "شروط الشراكة — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-bold text-primary">{value}</span>
    </div>
  );
}

function TermsPage() {
  const { token } = Route.useSearch();
  const query = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <PartnerAuthError />;
  if (query.isPending) return <PartnerOverviewSkeleton />;
  if (query.isError || !query.data) {
    return isPartnerAuthError(query.error) ? <PartnerAuthError /> : <PartnerTempError />;
  }

  const data = query.data;
  const empty =
    data.slaResponseMinutes == null &&
    data.slaMaxCancellationRate == null &&
    data.slaTerminationNoticeDays == null &&
    !data.slaNotes;

  return (
    <div className="space-y-6">
      <PartnerSection title="شروط الشراكة">
        {empty ? (
          <p className="text-sm text-muted-foreground">
            شروط الشراكة هتُضاف هنا بعد اعتماد العقد النهائي
          </p>
        ) : (
          <div>
            {data.slaResponseMinutes != null ? (
              <Row label="زمن الاستجابة (SLA)" value={`${data.slaResponseMinutes} دقيقة`} />
            ) : null}
            {data.slaMaxCancellationRate != null ? (
              <Row label="أقصى نسبة إلغاء" value={`${data.slaMaxCancellationRate}%`} />
            ) : null}
            {data.slaTerminationNoticeDays != null ? (
              <Row label="مدة إشعار الإنهاء" value={`${data.slaTerminationNoticeDays} يوم`} />
            ) : null}
            {data.slaNotes ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.slaNotes}</p>
            ) : null}
          </div>
        )}
      </PartnerSection>

      <PartnerSection title="حالة اعتماد الهوية">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={
              data.brandApproved
                ? "inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                : "inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-primary"
            }
          >
            {data.brandApproved ? "معتمد" : "قيد المراجعة"}
          </span>
          <p className="text-sm text-muted-foreground">لتحديث الشعار، تواصل مع فريق GoAir.</p>
        </div>
      </PartnerSection>
    </div>
  );
}
