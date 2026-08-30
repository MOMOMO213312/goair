import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PaymentBackLink } from "@/components/goair/payment/payment-back-link";
import { PaymentBookingSummary } from "@/components/goair/payment/payment-booking-summary";
import { PaymentHeader } from "@/components/goair/payment/payment-header";
import { PaymentMethodsForm } from "@/components/goair/payment/payment-methods-form";
import { PaymentMobileCta } from "@/components/goair/payment/payment-mobile-cta";
import { PaymentNotFound } from "@/components/goair/payment/payment-not-found";
import { PaymentPageSkeleton } from "@/components/goair/payment/payment-page-skeleton";
import { PaymentProgress } from "@/components/goair/payment/payment-progress";
import { Card } from "@/components/ui/card";
import {
  fetchPaymentMethods,
  fetchTrips,
  formatUsd,
  friendlyErrorMessage,
  getBookingByTicket,
  submitPayment,
} from "@/lib/goair";

const FORM_ID = "goair-payment-form";

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: String(search["ticket"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "إتمام الدفع — GoAir" },
      {
        name: "description",
        content: "راجع تفاصيل رحلتك واختر طريقة الدفع المناسبة لإتمام حجزك.",
      },
      { property: "og:title", content: "إتمام الدفع — GoAir" },
      {
        property: "og:description",
        content: "تحويل بنكي أو محفظة إلكترونية — وتأكيد بعد المراجعة.",
      },
    ],
  }),
  component: PaymentPage,
});

function bookingField(booking: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = booking[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

function PaymentPage() {
  const { ticket } = Route.useSearch();
  const navigate = useNavigate();
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["goair", "booking", ticket],
    queryFn: () => getBookingByTicket(ticket),
    enabled: Boolean(ticket),
  });

  const methodsQuery = useQuery({
    queryKey: ["goair", "payment-methods"],
    queryFn: () => fetchPaymentMethods(),
  });

  const tripsQuery = useQuery({
    queryKey: ["goair", "trips"],
    queryFn: fetchTrips,
    enabled: Boolean(bookingQuery.data),
  });

  const booking = bookingQuery.data;
  const tripId = booking ? bookingField(booking, ["trip_id"]) : "";
  const trip = tripsQuery.data?.find((item) => item.id === tripId);
  const total = Number(booking?.expected_total_usd ?? 0);
  const methods = methodsQuery.data ?? [];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!method) {
      toast.error("اختار طريقة الدفع.");
      return;
    }
    if (!booking?.["id"]) {
      toast.error("مش لاقيين الحجز — راجع كود التذكرة.");
      return;
    }
    setBusy(true);
    try {
      await submitPayment({
        bookingId: String(booking["id"]),
        method,
        amountUsd: total,
        referenceNumber: reference.trim() || null,
        proofUrl,
      });
      toast.success("استلمنا بيانات الدفع — بنراجعها الآن.");
      navigate({ to: "/confirmation", search: { ticket } });
    } catch (error) {
      toast.error(
        friendlyErrorMessage(error, "لم نتمكن من تسجيل الدفع. حاول مرة أخرى أو تواصل مع الدعم."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ticket) {
    return <PaymentNotFound />;
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="bg-mist/30 py-8 md:py-10">
        <PaymentPageSkeleton />
      </div>
    );
  }

  if (bookingQuery.isError) {
    return (
      <div className="bg-mist/30 py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <h1 className="font-display text-xl font-bold text-primary">تعذّر تحميل الحجز</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            حاول تحديث الصفحة. إذا استمرت المشكلة، راجع كود التذكرة أو تواصل مع الدعم.
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-mist/30 py-8">
        <PaymentNotFound />
      </div>
    );
  }

  return (
    <div className="bg-mist/30 pb-28 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <PaymentBackLink booking={booking} />

        <div className="mt-4">
          <PaymentHeader />
        </div>

        <div className="mt-6">
          <PaymentProgress />
        </div>

        {/* Mobile: summary first */}
        <div className="mt-6 lg:hidden">
          <PaymentBookingSummary booking={booking} trip={trip} ticket={ticket} />
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main: payment methods */}
          <PaymentMethodsForm
            formId={FORM_ID}
            ticket={ticket}
            methods={methods}
            methodsLoading={methodsQuery.isLoading}
            selectedMethod={method}
            reference={reference}
            busy={busy}
            onMethodChange={setMethod}
            onReferenceChange={setReference}
            onProofUploaded={setProofUrl}
            onProofCleared={() => setProofUrl(null)}
            onSubmit={onSubmit}
          />

          {/* Sidebar: summary + CTA (desktop) */}
          <aside className="hidden space-y-5 lg:block">
            <div className="sticky top-20 space-y-5">
              <PaymentBookingSummary booking={booking} trip={trip} ticket={ticket} />

              <Card className="border-accent/20 p-5 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-muted-foreground">الإجمالي</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-accent">
                  {formatUsd(total)}
                </p>
              </Card>

              <button
                type="submit"
                form={FORM_ID}
                disabled={busy || methods.length === 0}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-base font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    جاري تأكيد الدفع...
                  </>
                ) : (
                  "أرسلت الدفع"
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <PaymentMobileCta
        formId={FORM_ID}
        total={total}
        busy={busy}
        disabled={methods.length === 0}
      />
    </div>
  );
}
