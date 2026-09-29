import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Sparkles } from "lucide-react";

import {
  EmptyState,
  Field,
  ListSkeleton,
  PageTitle,
  StatusPill,
  useAccountFormat,
  type Tone,
} from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { customerListSubscriptions, type CustomerSubscription } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";

export const Route = createFileRoute("/account/subscriptions")({
  component: SubscriptionsPage,
});

const STATUS: Record<CustomerSubscription["status"], { key: string; tone: Tone }> = {
  pending_payment: { key: "statusPendingPayment", tone: "warning" },
  active: { key: "statusActive", tone: "success" },
  expired: { key: "statusExpired", tone: "neutral" },
  cancelled: { key: "statusCancelled", tone: "danger" },
};

function SubscriptionsPage() {
  const { t } = useTranslation();
  const { fmtDate, pick } = useAccountFormat();
  const q = useQuery({
    queryKey: ["customer", "subscriptions"],
    queryFn: customerListSubscriptions,
  });

  return (
    <div className="space-y-5">
      <PageTitle title={t("account.subs.title")} subtitle={t("account.subs.subtitle")} />
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <EmptyState icon={AlertCircle} title={t("account.common.error")}>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("account.common.retry")}
          </Button>
        </EmptyState>
      ) : q.data.length === 0 ? (
        <EmptyState icon={Sparkles} title={t("account.subs.empty")}>
          <Button asChild size="sm">
            <Link to="/explore" search={{ tab: "subscriptions" }}>
              {t("account.subs.browse")}
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {q.data.map((s) => {
            const st = STATUS[s.status];
            return (
              <article
                key={s.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-bold text-foreground">
                      {pick(s.planName, s.planNameEn)}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {s.code}
                    </p>
                  </div>
                  <StatusPill tone={st.tone}>
                    {t(`account.subs.${st.key}` as TranslationKey)}
                  </StatusPill>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label={t("account.subs.validity")}>
                    {s.startsAt || s.endsAt ? `${fmtDate(s.startsAt)} → ${fmtDate(s.endsAt)}` : "—"}
                  </Field>
                  {s.discountPercent ? (
                    <Field label={t("account.subs.discount")}>{s.discountPercent}%</Field>
                  ) : null}
                  {s.creditsRemaining != null ? (
                    <Field label={t("account.subs.credits")}>{s.creditsRemaining}</Field>
                  ) : null}
                  {s.ridesDiscounted != null ? (
                    <Field label={t("account.subs.discounted")}>{s.ridesDiscounted}</Field>
                  ) : null}
                </dl>
                {s.prioritySupport || s.guaranteedSeat ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.prioritySupport ? (
                      <StatusPill tone="info">{t("account.subs.priority")}</StatusPill>
                    ) : null}
                    {s.guaranteedSeat ? (
                      <StatusPill tone="info">{t("account.subs.guaranteed")}</StatusPill>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
