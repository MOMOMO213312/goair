import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CalendarCheck, Link2, Plane, Sparkles, Wallet, XCircle } from "lucide-react";

import {
  EmptyState,
  ListSkeleton,
  PageTitle,
  RouteLabel,
  useAccountFormat,
} from "@/components/account/account-ui";
import { ClaimDialog } from "@/components/account/claim-dialog";
import { Button } from "@/components/ui/button";
import { customerGetOverview, customerGetProfile } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";

export const Route = createFileRoute("/account/")({
  component: OverviewPage,
});

function Stat({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="mt-3 font-display text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function OverviewPage() {
  const { t } = useTranslation();
  const { fmtDateTime, fmtDate, money, pick } = useAccountFormat();
  const overview = useQuery({ queryKey: ["customer", "overview"], queryFn: customerGetOverview });
  const profile = useQuery({ queryKey: ["customer", "profile"], queryFn: customerGetProfile });

  const firstName = profile.data?.fullName?.trim().split(/\s+/)[0];
  const o = overview.data;

  if (overview.isPending) return <ListSkeleton />;
  if (overview.isError || !o) {
    return (
      <EmptyState icon={AlertCircle} title={t("account.common.error")}>
        <Button variant="outline" onClick={() => void overview.refetch()}>
          {t("account.common.retry")}
        </Button>
      </EmptyState>
    );
  }

  const trip = o.nextTrip;
  const sub = o.activeSubscription;

  return (
    <div className="space-y-6">
      <PageTitle
        title={
          firstName
            ? t("account.overview.greeting", { name: firstName })
            : t("account.overview.greetingNoName")
        }
        subtitle={t("account.overview.subtitle")}
        actions={
          <Button asChild size="sm">
            <Link to="/">{t("account.overview.bookCta")}</Link>
          </Button>
        }
      />

      {o.awaitingPaymentCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            {t("account.overview.awaitingPayment", { count: o.awaitingPaymentCount })}
          </p>
          <Button asChild size="sm" variant="outline" className="border-amber-400 bg-transparent">
            <Link to="/account/trips">{t("account.nav.trips")}</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={CalendarCheck}
          label={t("account.overview.statUpcoming")}
          value={String(o.upcomingCount)}
        />
        <Stat
          icon={Plane}
          label={t("account.overview.statCompleted")}
          value={String(o.completedCount)}
        />
        <Stat
          icon={XCircle}
          label={t("account.overview.statCancelled")}
          value={String(o.cancelledCount)}
        />
        <Stat
          icon={Wallet}
          label={t("account.overview.statSpent")}
          value={money(o.totalSpentUsd)}
        />
      </div>

      <section aria-labelledby="next-trip" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="next-trip" className="font-display text-base font-bold text-foreground">
          {t("account.overview.nextTrip")}
        </h2>
        {trip ? (
          <div className="mt-3 space-y-3">
            <p className="font-display text-xl font-extrabold text-primary">
              <RouteLabel
                origin={pick(trip.origin, trip.originEn)}
                destination={pick(trip.destination, trip.destinationEn)}
              />
            </p>
            <p className="text-sm font-semibold text-foreground">
              {trip.travelDatetime ? fmtDateTime(trip.travelDatetime) : fmtDate(trip.travelDate)}
            </p>
            {trip.driverName ? (
              <p className="text-sm text-muted-foreground">
                {trip.driverName}
                {trip.vehiclePlate ? <span dir="ltr"> • {trip.vehiclePlate}</span> : null}
              </p>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link to="/account/trips">{t("account.overview.viewTrip")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("account.overview.noNextTrip")}</p>
            <Button asChild size="sm">
              <Link to="/">{t("account.overview.bookCta")}</Link>
            </Button>
          </div>
        )}
      </section>

      {sub ? (
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-foreground/70">
            <Sparkles className="size-4" aria-hidden />
            {t("account.overview.activeSub")}
          </p>
          <p className="mt-2 font-display text-xl font-extrabold">
            {pick(sub.planName, sub.planNameEn)}
          </p>
          <ul className="mt-2 space-y-0.5 text-sm text-primary-foreground/85">
            {sub.credits != null && sub.credits > 0 ? (
              <li>{t("account.overview.creditsLeft", { count: sub.credits })}</li>
            ) : null}
            {sub.discountPercent ? (
              <li>{t("account.overview.discountLine", { percent: sub.discountPercent })}</li>
            ) : null}
            {sub.endsAt ? (
              <li>{t("account.overview.validUntil", { date: fmtDate(sub.endsAt) })}</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-5">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-foreground">
            {t("account.overview.claimTitle")}
          </p>
          <p className="text-xs text-muted-foreground">{t("account.overview.claimBody")}</p>
        </div>
        <ClaimDialog
          trigger={
            <Button size="sm" variant="outline" className="gap-1.5">
              <Link2 className="size-4" aria-hidden />
              {t("account.overview.claimCta")}
            </Button>
          }
        />
      </section>
    </div>
  );
}
