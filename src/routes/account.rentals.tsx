import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CarFront } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  ListSkeleton,
  PageTitle,
  StatusPill,
  useAccountFormat,
  type Tone,
} from "@/components/account/account-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { customerListRentals, type CustomerRental } from "@/lib/customer-account";
import { cancelRentalBookingByTicket } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";

export const Route = createFileRoute("/account/rentals")({
  component: RentalsPage,
});

const STATUS: Record<CustomerRental["status"], { key: string; tone: Tone }> = {
  pending: { key: "statusPending", tone: "info" },
  confirmed: { key: "statusConfirmed", tone: "success" },
  cancelled: { key: "statusCancelled", tone: "danger" },
  completed: { key: "statusCompleted", tone: "neutral" },
};

function RentalCard({ r }: { r: CustomerRental }) {
  const { t } = useTranslation();
  const { fmtDateTime, money } = useAccountFormat();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const s = STATUS[r.status];
  const canCancel =
    (r.status === "pending" || r.status === "confirmed") &&
    new Date(r.startDatetime).getTime() > Date.now();

  const cancel = useMutation({
    mutationFn: () =>
      cancelRentalBookingByTicket(r.ticketCode, t("account.trips.cancelledDefaultReason")),
    onSuccess: async () => {
      toast.success(t("account.trips.cancelledToast"));
      setConfirm(false);
      await qc.invalidateQueries({ queryKey: ["customer"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("account.common.error")),
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {r.vehiclePhoto ? (
          <img
            src={r.vehiclePhoto}
            alt=""
            loading="lazy"
            className="h-40 w-full object-cover sm:h-auto sm:w-48"
          />
        ) : null}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display text-base font-bold text-foreground">
                {r.vehicleMakeModel ?? t("account.rentals.vehicle")}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {r.ticketCode}
              </p>
            </div>
            <StatusPill tone={s.tone}>{t(`account.rentals.${s.key}` as TranslationKey)}</StatusPill>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Field label={t("account.rentals.start")}>{fmtDateTime(r.startDatetime)}</Field>
            <Field label={t("account.rentals.end")}>{fmtDateTime(r.endDatetime)}</Field>
            {r.pickupLocation ? (
              <Field label={t("account.rentals.pickup")}>{r.pickupLocation}</Field>
            ) : null}
            {r.driverName ? (
              <Field label={t("account.rentals.driver")}>{r.driverName}</Field>
            ) : null}
            {r.addonNames.length > 0 ? (
              <div className="col-span-2">
                <Field label={t("account.rentals.addons")}>{r.addonNames.join("، ")}</Field>
              </div>
            ) : null}
            <Field label={t("account.rentals.total")}>
              {r.totalUsd != null ? money(r.totalUsd + (r.addonsTotalUsd ?? 0)) : "—"}
            </Field>
          </dl>
          {canCancel ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 text-destructive"
              onClick={() => setConfirm(true)}
            >
              {t("account.trips.cancelBtn")}
            </Button>
          ) : null}
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.trips.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.trips.cancelBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("account.trips.keep")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={(e) => {
                e.preventDefault();
                cancel.mutate();
              }}
            >
              {t("account.trips.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function RentalsPage() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ["customer", "rentals"], queryFn: customerListRentals });

  return (
    <div className="space-y-5">
      <PageTitle title={t("account.rentals.title")} subtitle={t("account.rentals.subtitle")} />
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <EmptyState icon={AlertCircle} title={t("account.common.error")}>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("account.common.retry")}
          </Button>
        </EmptyState>
      ) : q.data.length === 0 ? (
        <EmptyState icon={CarFront} title={t("account.rentals.empty")}>
          <Button asChild size="sm">
            <Link to="/rent-a-car">{t("account.rentals.browse")}</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {q.data.map((r) => (
            <RentalCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
