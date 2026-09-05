import { createFileRoute } from "@tanstack/react-router";
import { Car, Gift, Loader2, MapPin, Phone, Search, UserRound, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelBookingByTicket,
  cancelSubscriptionByCode,
  formatUsd,
  friendlyErrorMessage,
  getBookingByTicket,
  getSubscriptionByCode,
  type BookingRecord,
  type SubscriptionRecord,
} from "@/lib/goair";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-bookings")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: String(search["ticket"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "حجزي — استعلام وإلغاء | GoAir" },
      {
        name: "description",
        content: "ابحث عن حجزك بكود التذكرة لعرض التفاصيل أو إلغاء الرحلة بدون رسوم.",
      },
      { property: "og:title", content: "حجزي — استعلام وإلغاء | GoAir" },
      { property: "og:description", content: "كود التذكرة يكفي لعرض حجزك أو إلغائه." },
    ],
  }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const initial = Route.useSearch();
  const [mode, setMode] = useState<"booking" | "subscription">("booking");

  const [code, setCode] = useState(initial.ticket);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [subCode, setSubCode] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [subBusy, setSubBusy] = useState(false);
  const [subCancelling, setSubCancelling] = useState(false);

  async function lookupSubscription(event: React.FormEvent) {
    event.preventDefault();
    if (subCode.trim().length < 4) {
      toast.error("اكتب كود الاشتراك.");
      return;
    }
    setSubBusy(true);
    try {
      const result = await getSubscriptionByCode(subCode);
      if (!result) {
        toast.error("مفيش اشتراك بالكود ده.");
        setSubscription(null);
      } else {
        setSubscription(result);
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "حصل خطأ في البحث."));
    } finally {
      setSubBusy(false);
    }
  }

  async function cancelSubscription() {
    setSubCancelling(true);
    try {
      await cancelSubscriptionByCode(subCode, "إلغاء من العميل");
      toast.success("تم إلغاء الاشتراك.");
      setSubscription(await getSubscriptionByCode(subCode));
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من الإلغاء."));
    } finally {
      setSubCancelling(false);
    }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (code.trim().length < 4) {
      toast.error("اكتب كود التذكرة.");
      return;
    }
    setBusy(true);
    try {
      const result = await getBookingByTicket(code);
      if (!result) {
        toast.error("مفيش حجز بالكود ده.");
        setBooking(null);
      } else {
        setBooking(result);
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "حصل خطأ في البحث."));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await cancelBookingByTicket(code, "إلغاء من العميل");
      toast.success("تم إلغاء الحجز.");
      setBooking(await getBookingByTicket(code));
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من الإلغاء."));
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
      <h1 className="font-display text-2xl font-extrabold text-primary">حجزي</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        اكتب كود التذكرة لعرض تفاصيل الحجز أو إلغائه، أو كود الاشتراك لعرض عضويتك.
      </p>

      <div className="mt-5 inline-flex rounded-lg border border-border bg-secondary/60 p-1">
        <button
          type="button"
          onClick={() => setMode("booking")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-bold transition-colors",
            mode === "booking" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          حجز رحلة
        </button>
        <button
          type="button"
          onClick={() => setMode("subscription")}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-bold transition-colors",
            mode === "subscription" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          اشتراك
        </button>
      </div>

      {mode === "booking" ? (
      <>
      <form onSubmit={lookup} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="ticket">كود التذكرة</Label>
          <Input
            id="ticket"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="GA-XXXXXX"
          />
        </div>
        <Button type="submit" disabled={busy} className="h-10">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          بحث
        </Button>
      </form>

      {booking ? (
        <Card className="mt-8 rounded-xl p-6 shadow-[var(--shadow-card)]">
          <dl className="space-y-2.5 text-sm">
            <Row label="الاسم" value={String(booking["full_name"] ?? "—")} />
            <Row label="التاريخ" value={String(booking["travel_date"] ?? "—")} />
            <Row label="عدد المقاعد" value={String(booking["seats_count"] ?? "—")} />
            <Row
              label="الإجمالي"
              value={booking.expected_total_usd ? formatUsd(Number(booking.expected_total_usd)) : "—"}
            />
            <Row label="الحالة" value={String(booking["status"] ?? "—")} />
          </dl>

          {isActive ? <TripStatusPanel booking={booking} /> : null}

          {status.includes("cancel") ? (
            <p className="mt-5 text-sm font-bold text-destructive">هذا الحجز ملغي.</p>
          ) : (
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={cancel}
              className="mt-6 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              إلغاء الحجز
            </Button>
          )}
        </Card>
      ) : null}
      </>
      ) : (
      <>
      <form onSubmit={lookupSubscription} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sub-code">كود الاشتراك</Label>
          <Input
            id="sub-code"
            value={subCode}
            onChange={(event) => setSubCode(event.target.value)}
            placeholder="مثال: 4f2a91c8b3d0"
          />
        </div>
        <Button type="submit" disabled={subBusy} className="h-10">
          {subBusy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          بحث
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
            <Row label="الاسم" value={subscription.full_name} />
            <Row label="يبدأ" value={subscription.starts_at ?? "—"} />
            <Row label="ينتهي" value={subscription.ends_at ?? "—"} />
            <Row label="رحلات مجانية متبقية" value={String(subscription.ride_credits_remaining)} />
            <Row label="رحلات استخدمت الخصم" value={String(subscription.rides_discounted_count)} />
            <Row label="نسبة الخصم" value={`${subscription.discount_percent}%`} />
            <Row label="الحالة" value={subscription.status} />
          </dl>

          {subscription.status.includes("cancel") ? (
            <p className="mt-5 text-sm font-bold text-destructive">هذا الاشتراك ملغي.</p>
          ) : (
            <Button
              variant="outline"
              disabled={subCancelling}
              onClick={cancelSubscription}
              className="mt-6 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {subCancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              إلغاء الاشتراك
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
        {assigned ? "🟢 سائقك متخصص" : "بانتظار تخصيص السائق والعربية"}
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
              <span>لوحة العربية: {vehiclePlate}</span>
            </div>
          ) : null}
          {meetingPoint ? (
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
              <span>نقطة الالتقاء: {meetingPoint}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          هيظهر هنا اسم السائق ورقم العربية أول ما فريق GoAir يخصصهم لرحلتك — الصفحة بتتحدث تلقائيًا.
        </p>
      )}
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