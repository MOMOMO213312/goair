import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PaymentMethodsForm } from "@/components/goair/payment/payment-methods-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSubscriptionSafe,
  fetchPaymentMethods,
  fetchSubscriptionPlanById,
  formatUsd,
  friendlyErrorMessage,
  submitSubscriptionPayment,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].subscribePage.meta;

const FORM_ID = "goair-subscription-payment-form";

export const Route = createFileRoute("/subscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    planId: String(search["planId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
    ],
  }),
  component: SubscribePage,
});

type Step = "form" | "payment" | "done";

function SubscribePage() {
  const { t } = useTranslation();
  const { planId } = Route.useSearch();
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const [subscriptionId, setSubscriptionId] = useState("");
  const [subscriptionCode, setSubscriptionCode] = useState("");
  const [expectedTotal, setExpectedTotal] = useState(0);

  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ["goair", "subscription-plan", planId],
    queryFn: () => fetchSubscriptionPlanById(planId),
    enabled: Boolean(planId),
  });

  const methodsQuery = useQuery({
    queryKey: ["goair", "payment-methods"],
    queryFn: () => fetchPaymentMethods(),
    enabled: step === "payment",
  });

  const plan = planQuery.data;

  async function onCreateSubscription(event: React.FormEvent) {
    event.preventDefault();
    if (!planId) {
      toast.error(t("subscribePage.noPlanSelectedError"));
      return;
    }
    if (fullName.trim().length < 3 || phone.trim().length < 8) {
      toast.error(t("subscribePage.nameAndPhoneRequired"));
      return;
    }
    setBusy(true);
    try {
      const result = await createSubscriptionSafe({
        planId,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
      });
      setSubscriptionId(result.subscriptionId);
      setSubscriptionCode(result.subscriptionCode);
      setExpectedTotal(result.expectedTotalUsd || plan?.priceUsd || 0);
      setStep("payment");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("subscribePage.createError")));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!method) {
      toast.error(t("subscribePage.choosePaymentMethod"));
      return;
    }
    setBusy(true);
    try {
      await submitSubscriptionPayment({
        subscriptionId,
        method,
        amountUsd: expectedTotal,
        referenceNumber: reference.trim() || null,
        proofUrl,
      });
      setStep("done");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, t("subscribePage.paymentSubmitError")));
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(subscriptionCode).then(() => toast.success(t("subscribePage.codeCopied")));
  }

  if (!planId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("subscribePage.noPlanSelected")}</p>
        <Button asChild className="mt-4">
          <Link to="/explore" search={{ tab: "subscriptions" }}>{t("subscribePage.viewAvailableSubscriptions")}</Link>
        </Button>
      </div>
    );
  }

  if (planQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">{t("subscribePage.loading")}</div>;
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("subscribePage.planNotFound")}</p>
        <Button asChild className="mt-4">
          <Link to="/explore" search={{ tab: "subscriptions" }}>{t("subscribePage.viewAvailableSubscriptions")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-mist/30 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <Card className="p-6 shadow-[var(--shadow-card)] sm:p-8">
          <p className="text-xs font-bold text-muted-foreground">{t("subscribePage.subscriptionLabel")}</p>
          <h1 className="mt-1 font-display text-xl font-extrabold text-primary">{plan.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{plan.country} · {t("subscribePage.discountLabel")} {plan.discountPercent}%</p>

          {step === "form" ? (
            <form onSubmit={onCreateSubscription} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">{t("subscribePage.nameLabel")}</Label>
                <Input id="sub-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-phone">{t("subscribePage.phoneLabel")}</Label>
                <Input id="sub-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <span className="text-sm font-bold text-muted-foreground">{t("subscribePage.priceLabel")}</span>
                <span className="font-display text-xl font-extrabold text-accent">{formatUsd(plan.priceUsd)}</span>
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full font-bold">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("subscribePage.continueToPayment")}
              </Button>
            </form>
          ) : null}

          {step === "payment" ? (
            <div className="mt-6">
              <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
                {t("subscribePage.subscriptionCodeNote")} <span className="font-mono font-bold">{subscriptionCode}</span> — {t("subscribePage.keepCodeNote")}
              </div>
              <PaymentMethodsForm
                formId={FORM_ID}
                ticket={subscriptionCode}
                methods={methodsQuery.data ?? []}
                methodsLoading={methodsQuery.isLoading}
                selectedMethod={method}
                reference={reference}
                busy={busy}
                onMethodChange={setMethod}
                onReferenceChange={setReference}
                onProofUploaded={setProofUrl}
                onProofCleared={() => setProofUrl(null)}
                onSubmit={onSubmitPayment}
              />
              <Button
                type="submit"
                form={FORM_ID}
                disabled={busy || (methodsQuery.data ?? []).length === 0}
                className="mt-4 h-11 w-full font-bold"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("subscribePage.paidSubmit")}
              </Button>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="mt-6 flex flex-col items-center text-center">
              <CheckCircle2 className="size-12 text-accent" aria-hidden />
              <p className="mt-3 font-display text-lg font-extrabold text-primary">{t("subscribePage.paymentReceivedTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("subscribePage.paymentReceivedBody")}
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5">
                <span className="font-mono text-sm font-bold text-primary">{subscriptionCode}</span>
                <button type="button" onClick={copyCode} className="text-muted-foreground hover:text-accent">
                  <Copy className="size-4" aria-hidden />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("subscribePage.keepCodeLong")}
              </p>
              <Button asChild className="mt-6">
                <Link to="/my-bookings" search={{ ticket: "" }}>{t("subscribePage.trackSubscription")}</Link>
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
