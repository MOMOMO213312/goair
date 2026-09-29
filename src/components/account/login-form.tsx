import { Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CUSTOMER_GOOGLE_LOGIN_ENABLED } from "@/lib/feature-flags";
import {
  sendEmailCode,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
  verifySignupCode,
} from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type Mode = "code" | "password";
type Step = "email" | "code";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.3 5.7c4.3-4 6.8-9.9 6.8-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.9 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function CustomerLoginForm() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("code");
  const [step, setStep] = useState<Step>("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignupCode, setNeedsSignupCode] = useState(false);

  function reset() {
    setStep("email");
    setCode("");
    setError(null);
    setNeedsSignupCode(false);
  }

  function mapError(
    err: unknown,
    fallback: "errGeneric" | "errCredentials" | "errInvalidCode",
  ): string {
    const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
    const status = (err as { status?: number })?.status;
    if (status === 429 || msg.includes("rate limit") || msg.includes("too many"))
      return t("account.login.errRate");
    return t(`account.login.${fallback}` as const);
  }

  async function wrap(
    fn: () => Promise<void>,
    fallback: "errGeneric" | "errCredentials" | "errInvalidCode",
  ) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(mapError(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  const onSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    void wrap(async () => {
      await sendEmailCode(email);
      setStep("code");
    }, "errGeneric");
  };

  const onVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    void wrap(
      () => (needsSignupCode ? verifySignupCode(email, code) : verifyEmailCode(email, code)),
      "errInvalidCode",
    );
  };

  const onPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("account.login.errPasswordShort"));
      return;
    }
    void wrap(
      async () => {
        if (isSignUp) {
          const signedIn = await signUpWithPassword(email, password, fullName);
          if (!signedIn) {
            setNeedsSignupCode(true);
            setStep("code");
          }
        } else {
          await signInWithPassword(email, password);
        }
      },
      isSignUp ? "errGeneric" : "errCredentials",
    );
  };

  const onResend = () =>
    void wrap(async () => {
      if (needsSignupCode) await signUpWithPassword(email, password, fullName);
      else await sendEmailCode(email);
      toast.success(t("account.login.codeSent", { email }));
    }, "errGeneric");

  const showCodeStep = step === "code";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
      <aside className="hidden flex-col justify-center rounded-3xl bg-primary p-8 text-primary-foreground md:flex">
        <h2 className="font-display text-3xl font-extrabold leading-tight">
          {t("account.login.title")}
        </h2>
        <p className="mt-3 text-sm text-primary-foreground/80">{t("account.login.subtitle")}</p>
        <ul className="mt-8 space-y-4">
          {(["benefit1", "benefit2", "benefit3"] as const).map((k) => (
            <li key={k} className="flex items-start gap-3 text-sm font-semibold">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              {t(`account.login.${k}` as const)}
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-foreground md:hidden">
          {t("account.login.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:hidden">
          {t("account.login.subtitle")}
        </p>

        {!showCodeStep ? (
          <div
            role="tablist"
            className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1 md:mt-0"
          >
            {(["code", "password"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                  mode === m ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
                )}
              >
                {m === "code" ? t("account.login.tabCode") : t("account.login.tabPassword")}
              </button>
            ))}
          </div>
        ) : null}

        {showCodeStep ? (
          <form onSubmit={onVerifyCode} className="mt-6 space-y-4">
            <p className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm text-foreground">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {needsSignupCode
                ? t("account.login.confirmEmail", { email })
                : t("account.login.codeSent", { email })}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="otp">{t("account.login.codeLabel")}</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                className="text-center text-lg font-bold tracking-[0.4em]"
                dir="ltr"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
              {busy ? t("account.login.verifying") : t("account.login.verify")}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={onResend}
                disabled={busy}
                className="font-semibold text-primary hover:underline"
              >
                {t("account.login.resend")}
              </button>
              <button
                type="button"
                onClick={reset}
                className="font-semibold text-muted-foreground hover:underline"
              >
                {t("account.login.changeEmail")}
              </button>
            </div>
          </form>
        ) : mode === "code" ? (
          <form onSubmit={onSendCode} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t("account.login.email")}</Label>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("account.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy || !email.trim()}>
              {busy ? t("account.login.sending") : t("account.login.sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={onPassword} className="mt-6 space-y-4">
            {isSignUp ? (
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">{t("account.login.fullName")}</Label>
                <Input
                  id="signup-name"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="pw-email">{t("account.login.email")}</Label>
              <Input
                id="pw-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">{t("account.login.password")}</Label>
              <Input
                id="pw"
                type="password"
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
              />
              {isSignUp ? (
                <p className="text-xs text-muted-foreground">{t("account.login.passwordHint")}</p>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {isSignUp ? t("account.login.createAccount") : t("account.login.signIn")}
            </Button>
            <div className="flex flex-col gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v);
                  setError(null);
                }}
                className="text-start font-semibold text-primary hover:underline"
              >
                {isSignUp ? t("account.login.haveAccount") : t("account.login.noAccount")}
              </button>
              {!isSignUp ? (
                <button
                  type="button"
                  onClick={() => setMode("code")}
                  className="text-start font-semibold text-muted-foreground hover:underline"
                >
                  {t("account.login.forgot")}
                </button>
              ) : null}
            </div>
          </form>
        )}

        {CUSTOMER_GOOGLE_LOGIN_ENABLED && !showCodeStep ? (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("account.login.or")}
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => void wrap(signInWithGoogle, "errGeneric")}
              disabled={busy}
            >
              <GoogleMark />
              {t("account.login.google")}
            </Button>
          </>
        ) : null}

        <Link
          to="/my-bookings"
          search={{ ticket: "" }}
          className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <Ticket className="size-4 shrink-0" aria-hidden />
          {t("account.login.guest")}
        </Link>
      </section>
    </div>
  );
}
