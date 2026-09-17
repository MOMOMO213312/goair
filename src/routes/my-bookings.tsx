import { createFileRoute } from "@tanstack/react-router";
import { Car, Gift, Loader2, MapPin, Phone, Search, Star, UserRound, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelBookingByTicket,
  cancelRentalBookingByTicket,
  cancelSubscriptionByCode,
  formatUsd,
  friendlyErrorMessage,
  getBookingByTicket,
  getBookingRatingEligibility,
  getRentalBookingByTicket,
  getSubscriptionByCode,
  submitCustomerRating,
  type BookingRatingEligibility,
  type BookingRecord,
  type RentalBookingRecord,
  type SubscriptionRecord,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const pageMeta = translations[DEFAULT_LANGUAGE].myBookingsPage.meta;

export const Route = createFileRoute("/my-bookings")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: String(search["ticket"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: pageMeta.title },
      {
        name: "description",
        content: pageMeta.description,
      },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
    ],
  }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const { t } = useTranslation();
  const initial = Route.useSearch();
  const [mode, setMode] = useState<"booking" | "rental" | "subscription">("booking");

  const [code, setCode] = useState(initial.ticket);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [ratingEligibility, setRatingEligibility] = useState<BookingRatingEligibility | null>(
    null,
  );

  const [rentalCode, setRentalCode] = useState("");
  const [rentalBooking, setRentalBooking] = useState<RentalBookingRecord | null>(null);
  const [rentalBusy, setRentalBusy] = useState(false);
  const [rentalCancelling, setRentalCancelling] = useState(false);

  const [subCode, setSubCode] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [subBusy, setSubBusy] = useState(false);
  const [subCancelling, setSubCancelling] = useState(false);

  async function lookupSubscription(event: React.FormEvent) {
    event.preventDefault();
    if (subCode.trim().length < 4) {
      toast.error(t("myBookingsPage.subscription.emptyCodeError"));
      return;
    }
    setSubBusy(true);
    try {
      const result = await getSubscriptionByCode(subCode);
      if (!result) {
        toast.error(t("myBookingsPage.subscription.notFoundError"));
        setSubscription(null);
      } else {
        setSubscription(result);
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.subscription.searchError")));
    } finally {
      setSubBusy(false);
    }
  }

  async function cancelSubscription() {
    setSubCancelling(true);
    try {
      await cancelSubscriptionByCode(subCode, t("myBookingsPage.subscription.cancelReason"));
      toast.success(t("myBookingsPage.subscription.cancelSuccess"));
      setSubscription(await getSubscriptionByCode(subCode));
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.subscription.cancelError")));
    } finally {
      setSubCancelling(false);
    }
  }

  async function lookupRental(event: React.FormEvent) {
    event.preventDefault();
    if (rentalCode.trim().length < 4) {
      toast.error(t("myBookingsPage.rental.emptyTicketError"));
      return;
    }
    setRentalBusy(true);
    try {
      const result = await getRentalBookingByTicket(rentalCode);
      if (!result) {
        toast.error(t("myBookingsPage.rental.notFoundError"));
        setRentalBooking(null);
      } else {
        setRentalBooking(result);
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.rental.searchError")));
    } finally {
      setRentalBusy(false);
    }
  }

  async function cancelRental() {
    setRentalCancelling(true);
    try {
      await cancelRentalBookingByTicket(rentalCode, t("myBookingsPage.rental.cancelReason"));
      toast.success(t("myBookingsPage.rental.cancelSuccess"));
      setRentalBooking(await getRentalBookingByTicket(rentalCode));
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.rental.cancelError")));
    } finally {
      setRentalCancelling(false);
    }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (code.trim().length < 4) {
      toast.error(t("myBookingsPage.booking.emptyTicketError"));
      return;
    }
    setBusy(true);
    try {
      const result = await getBookingByTicket(code);
      if (!result) {
        toast.error(t("myBookingsPage.booking.notFoundError"));
        setBooking(null);
        setRatingEligibility(null);
      } else {
        setBooking(result);
        getBookingRatingEligibility(code)
          .then(setRatingEligibility)
          .catch(() => setRatingEligibility(null));
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.booking.searchError")));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await cancelBookingByTicket(code, t("myBookingsPage.booking.cancelReason"));
      toast.success(t("myBookingsPage.booking.cancelSuccess"));
      setBooking(await getBookingByTicket(code));
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.booking.cancelError")));
    } finally {
      setCancelling(false);
    }
  }

  const status = String(booking?.["status"] ?? "");
  const isActive = Boolean(booking) && !status.includes("cancel");

  // "Live" trip status: quietly refresh while an active booking is open, so
  // a driver/vehicle assignment made from /admin shows up without the
  // customer needing to re-search manually.
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      getBookingByTicket(code).then(setBooking).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [isActive, code]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-2xl font-extrabold text-primary">
        {t("myBookingsPage.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("myBookingsPage.subtitle")}</p>

      <div className="mt-5 inline-flex rounded-lg border border-border bg-secondary/60 p-1">
        <button
          type="button"
          onClick={() => setMode("booking")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-bold transition-colors",
            mode === "booking" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          {t("myBookingsPage.tabs.booking")}
        </button>
        <button
          type="button"
          onClick={() => setMode("rental")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-bold transition-colors",
            mode === "rental" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          {t("myBookingsPage.tabs.rental")}
        </button>
        <button
          type="button"
          onClick={() => setMode("subscription")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-bold transition-colors",
            mode === "subscription" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          {t("myBookingsPage.tabs.subscription")}
        </button>
      </div>

      {mode === "booking" ? (
      <>
      <form onSubmit={lookup} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="ticket">{t("myBookingsPage.booking.ticketLabel")}</Label>
          <Input
            id="ticket"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t("myBookingsPage.booking.ticketPlaceholder")}
          />
        </div>
        <Button type="submit" disabled={busy} className="h-10">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {t("myBookingsPage.booking.searchButton")}
        </Button>
      </form>

      {booking ? (
        <Card className="mt-8 rounded-xl p-6 shadow-[var(--shadow-card)]">
          <dl className="space-y-2.5 text-sm">
            <Row label={t("myBookingsPage.booking.fields.name")} value={String(booking["full_name"] ?? "—")} />
            <Row label={t("myBookingsPage.booking.fields.date")} value={String(booking["travel_date"] ?? "—")} />
            <Row
              label={t("myBookingsPage.booking.fields.seats")}
              value={String(booking["seats_count"] ?? "—")}
            />
            <Row
              label={t("myBookingsPage.booking.fields.total")}
              value={booking.expected_total_usd ? formatUsd(Number(booking.expected_total_usd)) : "—"}
            />
            <Row label={t("myBookingsPage.booking.fields.status")} value={String(booking["status"] ?? "—")} />
          </dl>

          {isActive ? <TripStatusPanel booking={booking} /> : null}

          {status.includes("cancel") ? (
            <p className="mt-5 text-sm font-bold text-destructive">
              {t("myBookingsPage.booking.cancelledNote")}
            </p>
          ) : (
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={cancel}
              className="mt-6 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              {t("myBookingsPage.booking.cancelButton")}
            </Button>
          )}

          {ratingEligibility?.canRate ? (
            <TripRatingForm
              ticketCode={code}
              onSubmitted={(result) =>
                setRatingEligibility((current) =>
                  current
                    ? {
                        ...current,
                        alreadyRated: true,
                        existingStars: result.stars,
                        existingComment: result.comment,
                      }
                    : current,
                )
              }
            />
          ) : ratingEligibility?.alreadyRated ? (
            <TripRatingSummary
              stars={ratingEligibility.existingStars ?? 0}
              comment={ratingEligibility.existingComment}
            />
          ) : null}
        </Card>
      ) : null}
      </>
      ) : mode === "rental" ? (
      <>
      <form onSubmit={lookupRental} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rental-ticket">{t("myBookingsPage.rental.ticketLabel")}</Label>
          <Input
            id="rental-ticket"
            value={rentalCode}
            onChange={(event) => setRentalCode(event.target.value)}
            placeholder={t("myBookingsPage.rental.ticketPlaceholder")}
          />
        </div>
        <Button type="submit" disabled={rentalBusy} className="h-10">
          {rentalBusy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {t("myBookingsPage.rental.searchButton")}
        </Button>
      </form>

      {rentalBooking ? (
        <Card className="mt-8 rounded-xl p-6 shadow-[var(--shadow-card)]">
          <dl className="space-y-2.5 text-sm">
            <Row label={t("myBookingsPage.rental.fields.name")} value={rentalBooking.full_name} />
            <Row
              label={t("myBookingsPage.rental.fields.vehicle")}
              value={rentalBooking.vehicle_make_model ?? "—"}
            />
            <Row
              label={t("myBookingsPage.rental.fields.pickup")}
              value={rentalBooking.pickup_location}
            />
            <Row
              label={t("myBookingsPage.rental.fields.from")}
              value={new Date(rentalBooking.start_datetime).toLocaleString()}
            />
            <Row
              label={t("myBookingsPage.rental.fields.to")}
              value={new Date(rentalBooking.end_datetime).toLocaleString()}
            />
            <Row
              label={t("myBookingsPage.rental.fields.total")}
              value={formatUsd(Number(rentalBooking.total_usd))}
            />
            <Row label={t("myBookingsPage.rental.fields.status")} value={rentalBooking.status} />
          </dl>

          {rentalBooking.driver_full_name || rentalBooking.driver_phone_number ? (
            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <span className="size-2 rounded-full bg-accent" />
                {t("myBookingsPage.rental.driverLabel")}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {rentalBooking.driver_full_name ? (
                  <div className="flex items-center gap-2 text-primary">
                    <UserRound className="size-4 shrink-0 text-accent" aria-hidden />
                    <span className="font-bold">{rentalBooking.driver_full_name}</span>
                  </div>
                ) : null}
                {rentalBooking.driver_phone_number ? (
                  <a
                    href={`tel:${rentalBooking.driver_phone_number}`}
                    className="flex items-center gap-1 text-accent hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {rentalBooking.driver_phone_number}
                  </a>
                ) : null}
                {rentalBooking.vehicle_plate_number ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Car className="size-4 shrink-0 text-accent" aria-hidden />
                    <span>{rentalBooking.vehicle_plate_number}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {rentalBooking.status === "cancelled" ? (
            <p className="mt-5 text-sm font-bold text-destructive">
              {t("myBookingsPage.rental.cancelledNote")}
            </p>
          ) : rentalBooking.status === "completed" ? null : (
            <Button
              variant="outline"
              disabled={rentalCancelling}
              onClick={cancelRental}
              className="mt-6 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {rentalCancelling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              {t("myBookingsPage.rental.cancelButton")}
            </Button>
          )}
        </Card>
      ) : null}
      </>
      ) : (
      <>
      <form onSubmit={lookupSubscription} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sub-code">{t("myBookingsPage.subscription.codeLabel")}</Label>
          <Input
            id="sub-code"
            value={subCode}
            onChange={(event) => setSubCode(event.target.value)}
            placeholder={t("myBookingsPage.subscription.codePlaceholder")}
          />
        </div>
        <Button type="submit" disabled={subBusy} className="h-10">
          {subBusy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {t("myBookingsPage.subscription.searchButton")}
        </Button>
      </form>

      {subscription ? (
        <Card className="mt-8 rounded-xl p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Gift className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-display text-base font-extrabold text-primary">{subscription.plan_name}</p>
              <p className="text-xs text-muted-foreground">{subscription.plan_country}</p>
            </div>
          </div>
          <dl className="space-y-2.5 text-sm">
            <Row label={t("myBookingsPage.subscription.fields.name")} value={subscription.full_name} />
            <Row label={t("myBookingsPage.subscription.fields.startsAt")} value={subscription.starts_at ?? "—"} />
            <Row label={t("myBookingsPage.subscription.fields.endsAt")} value={subscription.ends_at ?? "—"} />
            <Row
              label={t("myBookingsPage.subscription.fields.creditsRemaining")}
              value={String(subscription.ride_credits_remaining)}
            />
            <Row
              label={t("myBookingsPage.subscription.fields.discountedCount")}
              value={String(subscription.rides_discounted_count)}
            />
            <Row
              label={t("myBookingsPage.subscription.fields.discountPercent")}
              value={`${subscription.discount_percent}%`}
            />
            <Row label={t("myBookingsPage.subscription.fields.status")} value={subscription.status} />
          </dl>

          {subscription.status.includes("cancel") ? (
            <p className="mt-5 text-sm font-bold text-destructive">
              {t("myBookingsPage.subscription.cancelledNote")}
            </p>
          ) : (
            <Button
              variant="outline"
              disabled={subCancelling}
              onClick={cancelSubscription}
              className="mt-6 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {subCancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              {t("myBookingsPage.subscription.cancelButton")}
            </Button>
          )}
        </Card>
      ) : null}
      </>
      )}
    </div>
  );
}

/** Live driver/vehicle assignment — appears automatically once staff assign it from /admin. */
function TripStatusPanel({ booking }: { booking: BookingRecord }) {
  const { t } = useTranslation();
  const driverName = booking["driver_name"] as string | null;
  const driverPhone = booking["driver_phone"] as string | null;
  const vehiclePlate = booking["vehicle_plate"] as string | null;
  const meetingPoint = booking["meeting_point"] as string | null;
  const assigned = Boolean(driverName || vehiclePlate);

  return (
    <div
      className={cn(
        "mt-5 rounded-lg border p-4",
        assigned ? "border-accent/30 bg-accent/5" : "border-border/80 bg-secondary/30",
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <span className={cn("size-2 rounded-full", assigned ? "bg-accent" : "bg-muted-foreground/40")} />
        {assigned ? t("myBookingsPage.tripStatus.assigned") : t("myBookingsPage.tripStatus.waiting")}
      </p>

      {assigned ? (
        <div className="mt-3 space-y-2 text-sm">
          {driverName ? (
            <div className="flex items-center gap-2 text-primary">
              <UserRound className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="font-bold">{driverName}</span>
              {driverPhone ? (
                <a
                  href={`tel:${driverPhone}`}
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <Phone className="size-3.5" aria-hidden />
                  {driverPhone}
                </a>
              ) : null}
            </div>
          ) : null}
          {vehiclePlate ? (
            <div className="flex items-center gap-2 text-primary">
              <Car className="size-4 shrink-0 text-accent" aria-hidden />
              <span>{t("myBookingsPage.tripStatus.vehiclePlate", { plate: vehiclePlate })}</span>
            </div>
          ) : null}
          {meetingPoint ? (
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
              <span>{t("myBookingsPage.tripStatus.meetingPoint", { point: meetingPoint })}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("myBookingsPage.tripStatus.unassignedHint")}
        </p>
      )}
    </div>
  );
}

function TripRatingForm({
  ticketCode,
  onSubmitted,
}: {
  ticketCode: string;
  onSubmitted: (result: { stars: number; comment: string | null }) => void;
}) {
  const { t } = useTranslation();
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (stars < 1) {
      toast.error(t("myBookingsPage.booking.rating.missingStars"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitCustomerRating(ticketCode, stars, comment);
      toast.success(t("myBookingsPage.booking.rating.submitSuccess"));
      onSubmitted({ stars: result.stars, comment: result.comment });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("myBookingsPage.booking.rating.submitError")));
    } finally {
      setSubmitting(false);
    }
  }

  const displayedStars = hoverStars || stars;

  return (
    <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
      <p className="font-display text-sm font-extrabold text-primary">
        {t("myBookingsPage.booking.rating.title")}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("myBookingsPage.booking.rating.subtitle")}
      </p>

      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHoverStars(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={String(value)}
            onMouseEnter={() => setHoverStars(value)}
            onClick={() => setStars(value)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                value <= displayedStars
                  ? "fill-accent text-accent"
                  : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("myBookingsPage.booking.rating.commentPlaceholder")}
        rows={3}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent"
      />

      <Button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-3 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting
          ? t("myBookingsPage.booking.rating.submitting")
          : t("myBookingsPage.booking.rating.submitButton")}
      </Button>
    </div>
  );
}

function TripRatingSummary({ stars, comment }: { stars: number; comment: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 rounded-lg border border-border/80 bg-secondary/30 p-4">
      <p className="text-xs font-bold text-muted-foreground">
        {t("myBookingsPage.booking.rating.alreadyRatedTitle")}
      </p>
      <div className="mt-1.5 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              "size-5",
              value <= stars ? "fill-accent text-accent" : "fill-transparent text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      {comment ? <p className="mt-2 text-sm text-foreground">{comment}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {t("myBookingsPage.booking.rating.thankYouNote")}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}