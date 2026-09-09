import { Link } from "@tanstack/react-router";
import { CreditCard, Plane, Users2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";

const PAYMENT_METHOD_KEYS = ["Visa", "Mastercard", "Apple Pay", "Cash"] as const;

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { t, language } = useTranslation();

  const paymentLabels: Record<(typeof PAYMENT_METHOD_KEYS)[number], string> = {
    Visa: "Visa",
    Mastercard: "Mastercard",
    "Apple Pay": "Apple Pay",
    Cash: language === "ar" ? "الدفع كاش" : "Cash on delivery",
  };

  async function onSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error(t("footer.invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      await subscribeNewsletter(email);
      setEmail("");
      toast.success(t("footer.subscribeSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("footer.subscribeError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
              <Plane className="size-5 -rotate-45" />
            </span>
            <span className="font-display text-xl font-extrabold">GoAir</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
            {t("footer.tagline")}
          </p>
          <form onSubmit={onSubscribe} className="mt-6 flex max-w-sm gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("footer.emailPlaceholder")}
              className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t("footer.subscribe")}
            </Button>
          </form>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">{t("footer.goairHeading")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li><Link to="/my-bookings" search={{ ticket: "" }}>{t("footer.myBookings")}</Link></li>
            <li><Link to="/partner">{t("footer.partnerPrograms")}</Link></li>
            <li><Link to="/rent-your-car">{t("footer.rentYourCar")}</Link></li>
            <li><Link to="/contact" search={{ package: undefined }}>{t("footer.contactUs")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">{t("footer.policiesHeading")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li>
              <Link to="/faq" className="transition-colors hover:text-primary-foreground">
                {t("footer.faq")}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-primary-foreground">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition-colors hover:text-primary-foreground">
                {t("footer.terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
            <Users2 className="size-4" aria-hidden />
            <span>{t("footer.trustedRiders")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHOD_KEYS.map((method) => (
              <span
                key={method}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 px-2.5 py-1 text-xs font-bold text-primary-foreground/80"
              >
                {method === "Apple Pay" ? (
                  <Wallet className="size-3.5" aria-hidden />
                ) : (
                  <CreditCard className="size-3.5" aria-hidden />
                )}
                {paymentLabels[method]}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} GoAir — {t("footer.tagFooter")}
      </div>
    </footer>
  );
}
