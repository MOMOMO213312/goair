import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Link2, Plane } from "lucide-react";
import { useState } from "react";

import { EmptyState, ListSkeleton, PageTitle } from "@/components/account/account-ui";
import { ClaimDialog } from "@/components/account/claim-dialog";
import { TripCard } from "@/components/account/trip-card";
import { Button } from "@/components/ui/button";
import { customerListBookings } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/trips")({
  component: TripsPage,
});

const PAGE = 20;
type Scope = "upcoming" | "past" | "all";

function TripsPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [pages, setPages] = useState(1);

  const q = useQuery({
    queryKey: ["customer", "bookings", scope, pages],
    queryFn: () => customerListBookings(scope, PAGE * pages, 0),
  });

  const tabs: { key: Scope; label: string }[] = [
    { key: "upcoming", label: t("account.trips.tabUpcoming") },
    { key: "past", label: t("account.trips.tabPast") },
    { key: "all", label: t("account.trips.tabAll") },
  ];
  const emptyKey =
    scope === "upcoming" ? "emptyUpcoming" : scope === "past" ? "emptyPast" : "emptyAll";

  return (
    <div className="space-y-5">
      <PageTitle
        title={t("account.trips.title")}
        subtitle={t("account.trips.subtitle")}
        actions={
          <ClaimDialog
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Link2 className="size-4" aria-hidden />
                {t("account.trips.link")}
              </Button>
            }
          />
        }
      />

      <div role="tablist" className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={scope === tab.key}
            onClick={() => {
              setScope(tab.key);
              setPages(1);
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
              scope === tab.key
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <EmptyState icon={AlertCircle} title={t("account.common.error")}>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("account.common.retry")}
          </Button>
        </EmptyState>
      ) : q.data.length === 0 ? (
        <EmptyState icon={Plane} title={t(`account.trips.${emptyKey}` as const)}>
          <Button asChild size="sm">
            <Link to="/">{t("account.overview.bookCta")}</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="space-y-3">
            {q.data.map((b) => (
              <TripCard key={b.id} booking={b} />
            ))}
          </div>
          {q.data.length >= PAGE * pages ? (
            <div className="text-center">
              <Button
                variant="outline"
                disabled={q.isFetching}
                onClick={() => setPages((p) => p + 1)}
              >
                {t("account.common.loadMore")}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
