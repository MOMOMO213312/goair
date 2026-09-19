import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchMyTransportApplication,
  fetchPublicLaunchMarketCountries,
  fetchVehicleTypes,
  sendTransportOperatorApplication,
  type TransportApplicationInput,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";

const pageMeta = translations[DEFAULT_LANGUAGE].joinTransportPage.meta;

export const Route = createFileRoute("/join-shared-transport")({
  head: () => ({
    meta: [
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.description },
    ],
  }),
  component: JoinSharedTransportPage,
});

const emptyForm: TransportApplicationInput = {
  providerType: "individual",
  fullName: "",
  phone: "",
  country: "",
  city: "",
  notes: "",
  companyName: "",
  commercialRegistrationNumber: "",
  taxNumber: "",
  fleetSize: "",
  vehicleTypeId: "",
  plateNumber: "",
  carMakeModel: "",
  carYear: "",
  hasDriverLicense: true,
  licenseNumber: "",
  licenseExpiry: "",
  registrationExpiry: "",
  insuranceExpiry: "",
  nationalIdNumber: "",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-extrabold text-primary">{children}</h2>;
}

type AuthUser = { id: string; email: string } | null;

function useAuthUser() {
  const [user, setUser] = useState<AuthUser>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}

function JoinSharedTransportPage() {
  const { t } = useTranslation();
  const { user, ready } = useAuthUser();

  const applicationQuery = useQuery({
    queryKey: ["goair", "my-transport-application", user?.id],
    queryFn: fetchMyTransportApplication,
    enabled: Boolean(user),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-extrabold text-primary">
        {t("joinTransportPage.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("joinTransportPage.subtitle")}</p>

      <div className="mt-6">
        {!ready || (user && applicationQuery.isPending) ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <AuthCard />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {t("joinTransportPage.signedInAs")} <span dir="ltr">{user.email}</span>
              </span>
              <button
                type="button"
                className="font-bold text-primary underline-offset-2 hover:underline"
                onClick={() => supabase.auth.signOut()}
              >
                {t("joinTransportPage.signOut")}
              </button>
            </div>
            <ApplicantArea application={applicationQuery.data ?? null} userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}

function AuthCard() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("joinTransportPage.authMissing"));
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) {
        toast.error(t("joinTransportPage.passwordShort"));
        return;
      }
      if (password !== confirm) {
        toast.error(t("joinTransportPage.passwordMismatch"));
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // With "Confirm email" enabled Supabase returns no session until the link is opened.
        if (!data.session) setNeedsConfirm(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("joinTransportPage.authError"));
    } finally {
      setBusy(false);
    }
  }

  if (needsConfirm) {
    return (
      <Card className="rounded-xl p-6 text-center shadow-[var(--shadow-card)]">
        <CheckCircle2 className="mx-auto size-12 text-accent" />
        <h2 className="mt-3 font-display text-lg font-extrabold text-primary">
          {t("joinTransportPage.confirmEmailTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("joinTransportPage.confirmEmailBody")}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setNeedsConfirm(false);
            setMode("signin");
          }}
        >
          {t("joinTransportPage.modeSignIn")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl p-6 shadow-[var(--shadow-card)]">
      <SectionTitle>{t("joinTransportPage.accountTitle")}</SectionTitle>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["signup", "signin"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {m === "signup" ? t("joinTransportPage.modeSignUp") : t("joinTransportPage.modeSignIn")}
          </Button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="a-email">{t("joinTransportPage.emailLabel")}</Label>
          <Input
            id="a-email"
            type="email"
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-pass">{t("joinTransportPage.passwordLabel")}</Label>
          <Input
            id="a-pass"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="a-confirm">{t("joinTransportPage.confirmPasswordLabel")}</Label>
            <Input
              id="a-confirm"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : null}
          {mode === "signup"
            ? t("joinTransportPage.signUpButton")
            : t("joinTransportPage.signInButton")}
        </Button>
      </form>
    </Card>
  );
}

function ApplicantArea({
  application,
  userId,
}: {
  application: Awaited<ReturnType<typeof fetchMyTransportApplication>>;
  userId: string;
}) {
  const { t } = useTranslation();
  const isOpen = application?.status === "pending_review" || application?.status === "contacted";

  if (application && isOpen) {
    return (
      <StatusCard
        icon={<Clock className="mx-auto size-12 text-accent" />}
        title={t("joinTransportPage.statusPendingTitle")}
        body={t("joinTransportPage.statusPendingBody")}
      />
    );
  }

  if (application?.status === "approved") {
    return (
      <StatusCard
        icon={<CheckCircle2 className="mx-auto size-12 text-accent" />}
        title={t("joinTransportPage.statusApprovedTitle")}
        body={t("joinTransportPage.statusApprovedBody")}
      >
        <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/operator">{t("joinTransportPage.statusApprovedCta")}</Link>
        </Button>
      </StatusCard>
    );
  }

  return (
    <div className="space-y-4">
      {application?.status === "rejected" ? (
        <StatusCard
          icon={<XCircle className="mx-auto size-10 text-destructive" />}
          title={t("joinTransportPage.statusRejectedTitle")}
          body={t("joinTransportPage.statusRejectedBody")}
        />
      ) : null}
      <ApplicationForm userId={userId} />
    </div>
  );
}

function StatusCard({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl p-6 text-center shadow-[var(--shadow-card)]">
      {icon}
      <h2 className="mt-3 font-display text-lg font-extrabold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {children}
    </Card>
  );
}

function ApplicationForm({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const vehicleTypesQuery = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const countriesQuery = useQuery({
    queryKey: ["goair", "public-launch-market-countries"],
    queryFn: fetchPublicLaunchMarketCountries,
  });
  const countries = countriesQuery.data ?? [];

  const [form, setForm] = useState<TransportApplicationInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const isCompany = form.providerType === "company";

  function set<K extends keyof TransportApplicationInput>(
    key: K,
    value: TransportApplicationInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const today = todayIso();

    if (!form.fullName.trim() || !form.phone.trim() || !form.country) {
      toast.error(t("joinTransportPage.missingFields"));
      return;
    }
    if (isCompany) {
      if (
        !form.companyName.trim() ||
        !form.commercialRegistrationNumber.trim() ||
        !form.fleetSize.trim()
      ) {
        toast.error(t("joinTransportPage.missingCompanyFields"));
        return;
      }
    } else {
      if (
        !form.vehicleTypeId ||
        !form.plateNumber.trim() ||
        !form.registrationExpiry ||
        !form.insuranceExpiry
      ) {
        toast.error(t("joinTransportPage.missingVehicleFields"));
        return;
      }
      if (form.hasDriverLicense && (!form.licenseNumber.trim() || !form.licenseExpiry)) {
        toast.error(t("joinTransportPage.licenseMissing"));
        return;
      }
      const dates = [form.registrationExpiry, form.insuranceExpiry];
      if (form.hasDriverLicense) dates.push(form.licenseExpiry);
      if (dates.some((d) => d <= today)) {
        toast.error(t("joinTransportPage.expiredDates"));
        return;
      }
    }

    setBusy(true);
    try {
      await sendTransportOperatorApplication({
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        companyName: form.companyName.trim(),
        commercialRegistrationNumber: form.commercialRegistrationNumber.trim(),
        taxNumber: form.taxNumber.trim(),
        plateNumber: form.plateNumber.trim(),
        carMakeModel: form.carMakeModel.trim(),
        licenseNumber: form.licenseNumber.trim(),
        nationalIdNumber: form.nationalIdNumber.trim(),
        notes: form.notes.trim(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["goair", "my-transport-application", userId],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("joinTransportPage.sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-xl p-6 shadow-[var(--shadow-card)]">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>{t("joinTransportPage.providerTypeLabel")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["individual", "company"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={form.providerType === type ? "default" : "outline"}
                onClick={() => set("providerType", type)}
              >
                {type === "individual"
                  ? t("joinTransportPage.typeIndividual")
                  : t("joinTransportPage.typeCompany")}
              </Button>
            ))}
          </div>
        </div>

        <SectionTitle>{t("joinTransportPage.ownerSection")}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="t-name">{t("joinTransportPage.nameLabel")}</Label>
            <Input
              id="t-name"
              autoComplete="name"
              maxLength={120}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-phone">{t("joinTransportPage.phoneLabel")}</Label>
            <Input
              id="t-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("joinTransportPage.countryLabel")}</Label>
            <Select value={form.country} onValueChange={(v) => set("country", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("joinTransportPage.countryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-city">{t("joinTransportPage.cityLabel")}</Label>
            <Input id="t-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>

        {isCompany ? (
          <>
            <SectionTitle>{t("joinTransportPage.companySection")}</SectionTitle>
            <div className="space-y-2">
              <Label htmlFor="t-company">{t("joinTransportPage.companyNameLabel")}</Label>
              <Input
                id="t-company"
                maxLength={150}
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-cr">{t("joinTransportPage.commercialRegLabel")}</Label>
                <Input
                  id="t-cr"
                  dir="ltr"
                  maxLength={50}
                  value={form.commercialRegistrationNumber}
                  onChange={(e) => set("commercialRegistrationNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-tax">{t("joinTransportPage.taxNumberLabel")}</Label>
                <Input
                  id="t-tax"
                  dir="ltr"
                  maxLength={50}
                  value={form.taxNumber}
                  onChange={(e) => set("taxNumber", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-fleet">{t("joinTransportPage.fleetSizeLabel")}</Label>
              <Input
                id="t-fleet"
                inputMode="numeric"
                dir="ltr"
                maxLength={5}
                value={form.fleetSize}
                onChange={(e) => set("fleetSize", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("joinTransportPage.companyFleetNote")}
            </p>
          </>
        ) : (
          <>
            <SectionTitle>{t("joinTransportPage.vehicleSection")}</SectionTitle>
            <div className="space-y-2">
              <Label>{t("joinTransportPage.vehicleTypeLabel")}</Label>
              <Select value={form.vehicleTypeId} onValueChange={(v) => set("vehicleTypeId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("joinTransportPage.vehicleTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(vehicleTypesQuery.data ?? []).map((vt) => (
                    <SelectItem key={vt.id} value={vt.id}>
                      {vt.labelAr} · {vt.capacity} {t("joinTransportPage.seatsSuffix")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-plate">{t("joinTransportPage.plateLabel")}</Label>
                <Input
                  id="t-plate"
                  maxLength={20}
                  value={form.plateNumber}
                  onChange={(e) => set("plateNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-year">{t("joinTransportPage.carYearLabel")}</Label>
                <Input
                  id="t-year"
                  inputMode="numeric"
                  maxLength={4}
                  dir="ltr"
                  value={form.carYear}
                  onChange={(e) => set("carYear", e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="t-car">{t("joinTransportPage.carMakeModelLabel")}</Label>
              <Input
                id="t-car"
                placeholder={t("joinTransportPage.carMakeModelPlaceholder")}
                value={form.carMakeModel}
                onChange={(e) => set("carMakeModel", e.target.value)}
              />
            </div>

            <SectionTitle>{t("joinTransportPage.docsSection")}</SectionTitle>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <Label htmlFor="t-license" className="cursor-pointer">
                {t("joinTransportPage.hasDriverLicenseLabel")}
              </Label>
              <Switch
                id="t-license"
                checked={form.hasDriverLicense}
                onCheckedChange={(checked) => set("hasDriverLicense", checked)}
              />
            </div>
            {form.hasDriverLicense ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="t-lic-no">{t("joinTransportPage.licenseNumberLabel")}</Label>
                  <Input
                    id="t-lic-no"
                    dir="ltr"
                    value={form.licenseNumber}
                    onChange={(e) => set("licenseNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-lic-exp">{t("joinTransportPage.licenseExpiryLabel")}</Label>
                  <Input
                    id="t-lic-exp"
                    type="date"
                    dir="ltr"
                    min={todayIso()}
                    value={form.licenseExpiry}
                    onChange={(e) => set("licenseExpiry", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("joinTransportPage.notDriverHint")}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-reg-exp">{t("joinTransportPage.registrationExpiryLabel")}</Label>
                <Input
                  id="t-reg-exp"
                  type="date"
                  dir="ltr"
                  min={todayIso()}
                  value={form.registrationExpiry}
                  onChange={(e) => set("registrationExpiry", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-ins-exp">{t("joinTransportPage.insuranceExpiryLabel")}</Label>
                <Input
                  id="t-ins-exp"
                  type="date"
                  dir="ltr"
                  min={todayIso()}
                  value={form.insuranceExpiry}
                  onChange={(e) => set("insuranceExpiry", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="t-nid">{t("joinTransportPage.nationalIdLabel")}</Label>
              <Input
                id="t-nid"
                dir="ltr"
                value={form.nationalIdNumber}
                onChange={(e) => set("nationalIdNumber", e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="t-notes">{t("joinTransportPage.notesLabel")}</Label>
          <Textarea
            id="t-notes"
            rows={4}
            maxLength={2000}
            placeholder={t("joinTransportPage.notesPlaceholder")}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">{t("joinTransportPage.reviewNote")}</p>

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : null}
          {t("joinTransportPage.submit")}
        </Button>
      </form>
    </Card>
  );
}
