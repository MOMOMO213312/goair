import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Calendar, Check, Copy, MapPin, Plane, Star, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  RouteLabel,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingByTicket, submitCustomerRating } from "@/lib/goair";
import type { CustomerBooking } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function bookingBadge(b: CustomerBooking): { key: string; tone: Tone } {
  if (b.status === "cancelled") return { key: "statusCancelled", tone: "danger" };
  if (b.status === "confirmed") {
    return b.isUpcoming
      ? { key: "statusConfirmed", tone: "success" }
      : { key: "statusCompleted", tone: "neutral" };
  }
  if (b.paymentStatus === "pending_review") return { key: "statusPaymentReview", tone: "warning" };
  if (b.paymentStatus === "rejected") return { key: "statusPaymentRejected", tone: "danger" };
  if (b.paymentStatus === null) return { key: "statusAwaitingPayment", tone: "warning" };
  return { key: "statusPending", tone: "info" };
}

function needsPayment(b: CustomerBooking) {
  return b.status === "pending" && (b.paymentStatus === null || b.paymentStatus === "rejected");
}

export function TripCard({ booking: b }: { booking: CustomerBooking }) {
  const { t } = useTranslation();
  const { fmtDateTime, fmtDate, money, pick } = useAccountFormat();
  const [open, setOpen] = useState(false);
  const badge = bookingBadge(b);

  const origin = pick(b.origin, b.originEn);
  const destination = pick(b.destination, b.destinationEn);
  const when = b.travelDatetime ? fmtDateTime(b.travelDatetime) : fmtDate(b.travelDate);

  return (
    <>
      <article
        className={cn(
          "rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
          b.status === "cancelled" && "opacity-75",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Plane className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-display text-base font-bold text-foreground">
                <RouteLabel origin={origin} destination={destination} />
              </p>
              <p className="text-xs text-muted-foreground">
                {b.bookingType === "private"
                  ? t("account.trips.typePrivate")
                  : t("account.trips.typeShared")}
                {" • "}
                <span dir="ltr">{b.ticketCode}</span>
              </p>
            </div>
          </div>
          <StatusPill tone={badge.tone}>
            {t(`account.trips.${badge.key}` as TranslationKey)}
          </StatusPill>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("account.trips.date")}>{when}</Field>
          <Field label={t("account.trips.seats")}>
            {t("account.common.seats", { count: b.seatsCount })}
          </Field>
          <Field label={t("account.trips.driver")}>
            {b.driverName ?? t("account.trips.notAssigned")}
          </Field>
          <Field label={t("account.trips.total")}>
            {b.expectedTotalUsd != null ? money(b.expectedTotalUsd) : "—"}
          </Field>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {t("account.overview.viewTrip")}
          </Button>
          {needsPayment(b) ? (
            <Button size="sm" asChild>
              <Link to="/payment" search={{ ticket: b.ticketCode }}>
                {t("account.overview.finishPayment")}
              </Link>
            </Button>
          ) : null}
        </div>
      </article>

      <TripDetails booking={b} open={open} onOpenChange={setOpen} />
    </>
  );
}

function TripDetails({
  booking: b,
  open,
  onOpenChange,
}: {
  booking: CustomerBooking;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const { fmtDateTime, fmtDate, money, pick } = useAccountFormat();
  const qc = useQueryClient();
  const badge = bookingBadge(b);
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["customer"] });

  const cancel = useMutation({
    mutationFn: () =>
      cancelBookingByTicket(
        b.ticketCode,
        reason.trim() || t("account.trips.cancelledDefaultReason"),
      ),
    onSuccess: async () => {
      toast.success(t("account.trips.cancelledToast"));
      setConfirmCancel(false);
      onOpenChange(false);
      await refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("account.common.error")),
  });

  const rate = useMutation({
    mutationFn: () => submitCustomerRating(b.ticketCode, stars, comment),
    onSuccess: async () => {
      toast.success(t("account.trips.rateThanks"));
      await refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("account.common.error")),
  });

  const canCancel = b.isUpcoming && b.status !== "cancelled";
  const canRate = b.status === "confirmed" && !b.isUpcoming && b.ratingStars == null;
  const canTrack = b.isUpcoming && b.status === "confirmed" && Boolean(b.driverName);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(b.ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked; the code is visible anyway */
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <RouteLabel
                origin={pick(b.origin, b.originEn)}
                destination={pick(b.destination, b.destinationEn)}
              />
              <StatusPill tone={badge.tone}>
                {t(`account.trips.${badge.key}` as TranslationKey)}
              </StatusPill>
            </DialogTitle>
            <DialogDescription>
              {b.bookingType === "private"
                ? t("account.trips.typePrivate")
                : t("account.trips.typeShared")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t("account.trips.ticket")}
              </p>
              <p
                className="font-display text-lg font-extrabold tracking-wider text-primary"
                dir="ltr"
              >
                {b.ticketCode}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copyCode}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied ? t("account.common.copied") : t("account.common.copy")}
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t("account.trips.date")}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" aria-hidden />
                {b.travelDatetime ? fmtDateTime(b.travelDatetime) : fmtDate(b.travelDate)}
              </span>
            </Field>
            <Field label={t("account.trips.seats")}>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" aria-hidden />
                {b.seatsCount}
              </span>
            </Field>
            {b.luggageCount != null ? (
              <Field label={t("account.trips.luggage")}>{b.luggageCount}</Field>
            ) : null}
            {b.flightNumber ? (
              <Field label={t("account.trips.flight")}>
                <span dir="ltr">{b.flightNumber}</span>
              </Field>
            ) : null}
            {b.meetingPoint ? (
              <div className="col-span-2">
                <Field label={t("account.trips.meetingPoint")}>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                    {b.meetingPoint}
                  </span>
                </Field>
              </div>
            ) : null}
            {b.packageName ? (
              <Field label={t("account.trips.package")}>
                {pick(b.packageName, b.packageNameEn)}
              </Field>
            ) : null}
            {b.passengerNames.length > 0 ? (
              <div className="col-span-2">
                <Field label={t("account.trips.passengers")}>{b.passengerNames.join("، ")}</Field>
              </div>
            ) : null}
            <Field label={t("account.trips.driver")}>
              {b.driverName ? (
                <>
                  {b.driverName}
                  {b.driverPhone ? (
                    <a
                      href={`tel:${b.driverPhone}`}
                      dir="ltr"
                      className="ms-2 text-primary hover:underline"
                    >
                      {b.driverPhone}
                    </a>
                  ) : null}
                </>
              ) : (
                t("account.trips.notAssigned")
              )}
            </Field>
            <Field label={t("account.trips.vehicle")}>
              {b.vehiclePlate ? (
                <>
                  {b.vehicleModel ? `${b.vehicleModel} • ` : ""}
                  <span dir="ltr">{b.vehiclePlate}</span>
                </>
              ) : (
                t("account.trips.notAssigned")
              )}
            </Field>
            <Field label={t("account.trips.total")}>
              {b.expectedTotalUsd != null ? money(b.expectedTotalUsd) : "—"}
            </Field>
            {b.invoiceNumber != null ? (
              <Field label={t("account.trips.invoice")}>#{b.invoiceNumber}</Field>
            ) : null}
            {b.status === "cancelled" ? (
              <>
                {b.cancellationReason ? (
                  <div className="col-span-2">
                    <Field label={t("account.trips.cancelReason")}>{b.cancellationReason}</Field>
                  </div>
                ) : null}
                {b.refundStatus && b.refundStatus !== "not_applicable" ? (
                  <Field label={t("account.trips.refund")}>
                    {b.refundStatus === "refunded"
                      ? t("account.trips.refundRefunded")
                      : b.refundStatus === "denied"
                        ? t("account.trips.refundDenied")
                        : t("account.trips.refundPending")}
                  </Field>
                ) : null}
              </>
            ) : null}
          </dl>

          {canRate ? (
            <div className="rounded-xl border border-border p-4">
              <p className="font-display text-sm font-bold">{t("account.trips.rateTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("account.trips.rateSubtitle")}</p>
              <div
                className="mt-3 flex gap-1"
                role="radiogroup"
                aria-label={t("account.trips.rateTitle")}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={String(n)}
                    onClick={() => setStars(n)}
                    className="rounded p-0.5"
                  >
                    <Star
                      className={cn(
                        "size-7",
                        n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("account.trips.ratePlaceholder")}
                className="mt-3"
                rows={2}
              />
              <Button
                className="mt-3"
                size="sm"
                disabled={rate.isPending}
                onClick={() =>
                  stars === 0 ? toast.error(t("account.trips.rateMissing")) : rate.mutate()
                }
              >
                {t("account.trips.rateSubmit")}
              </Button>
            </div>
          ) : b.ratingStars != null ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              {t("account.trips.yourRating", { count: b.ratingStars })}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {needsPayment(b) ? (
              <Button size="sm" asChild>
                <Link to="/payment" search={{ ticket: b.ticketCode }}>
                  {t("account.overview.finishPayment")}
                </Link>
              </Button>
            ) : null}
            {canTrack ? (
              <Button size="sm" variant="outline" asChild>
                <Link to="/my-bookings" search={{ ticket: b.ticketCode }}>
                  {t("account.trips.track")}
                </Link>
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="outline"
                className="ms-auto text-destructive"
                onClick={() => setConfirmCancel(true)}
              >
                {t("account.trips.cancelBtn")}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.trips.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.trips.cancelBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("account.trips.cancelReasonPlaceholder")}
            rows={2}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("account.trips.keep")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancel.mutate();
              }}
              disabled={cancel.isPending}
            >
              {t("account.trips.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
