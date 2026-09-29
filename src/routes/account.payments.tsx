import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CreditCard } from "lucide-react";

import {
  EmptyState,
  ListSkeleton,
  PageTitle,
  StatusPill,
  useAccountFormat,
  type Tone,
} from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { customerListPayments, type CustomerPayment } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";

export const Route = createFileRoute("/account/payments")({
  component: PaymentsPage,
});

const STATUS: Record<CustomerPayment["reviewStatus"], { key: string; tone: Tone }> = {
  pending_review: { key: "statusPending", tone: "warning" },
  confirmed: { key: "statusConfirmed", tone: "success" },
  rejected: { key: "statusRejected", tone: "danger" },
};

function PaymentsPage() {
  const { t } = useTranslation();
  const { fmtDateTime, money } = useAccountFormat();
  const q = useQuery({
    queryKey: ["customer", "payments"],
    queryFn: () => customerListPayments(100),
  });

  return (
    <div className="space-y-5">
      <PageTitle title={t("account.payments.title")} subtitle={t("account.payments.subtitle")} />
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <EmptyState icon={AlertCircle} title={t("account.common.error")}>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("account.common.retry")}
          </Button>
        </EmptyState>
      ) : q.data.length === 0 ? (
        <EmptyState icon={CreditCard} title={t("account.payments.empty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {q.data.map((p, i) => {
            const st = STATUS[p.reviewStatus];
            return (
              <li
                key={`${p.referenceCode}-${p.createdAt}-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {p.kind === "booking"
                      ? t("account.payments.kindBooking")
                      : t("account.payments.kindSubscription")}
                    <span className="ms-2 text-xs font-semibold text-muted-foreground" dir="ltr">
                      {p.referenceCode}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtDateTime(p.createdAt)}
                    {p.method ? ` • ${p.method}` : ""}
                    {p.referenceNumber ? <span dir="ltr"> • {p.referenceNumber}</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-base font-extrabold text-foreground">
                    {money(p.amountUsd)}
                  </span>
                  <StatusPill tone={st.tone}>
                    {t(`account.payments.${st.key}` as TranslationKey)}
                  </StatusPill>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
