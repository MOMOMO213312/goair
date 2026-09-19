import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
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
  fetchPublicLaunchMarketCountries,
  fetchVehicleTypes,
  sendTransportOperatorApplication,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

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

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  country: "",
  city: "",
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
  notes: "",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-extrabold text-primary">{children}</h2>;
}

function JoinSharedTransportPage() {
  const { t } = useTranslation();
  const vehicleTypesQuery = useQuery({
    queryKey: ["goair", "vehicle-types"],
    queryFn: fetchVehicleTypes,
  });
  const countriesQuery = useQuery({
    queryKey: ["goair", "public-launch-market-countries"],
    queryFn: fetchPublicLaunchMarketCountries,
  });
  const countries = countriesQuery.data ?? [];

  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const today = todayIso();

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.country ||
      !form.vehicleTypeId ||
      !form.plateNumber.trim() ||
      !form.registrationExpiry ||
      !form.insuranceExpiry
    ) {
      toast.error(t("joinTransportPage.missingFields"));
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

    setBusy(true);
    try {
      await sendTransportOperatorApplication({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        country: form.country,
        city: form.city.trim(),
        vehicleTypeId: form.vehicleTypeId,
        plateNumber: form.plateNumber.trim(),
        carMakeModel: form.carMakeModel.trim(),
        carYear: form.carYear.trim(),
        hasDriverLicense: form.hasDriverLicense,
        licenseNumber: form.licenseNumber.trim(),
        licenseExpiry: form.licenseExpiry,
        registrationExpiry: form.registrationExpiry,
        insuranceExpiry: form.insuranceExpiry,
        nationalIdNumber: form.nationalIdNumber.trim(),
        notes: form.notes.trim(),
      });
      setDone(true);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("joinTransportPage.sendError"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-accent" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-primary">
          {t("joinTransportPage.successTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("joinTransportPage.successBody")}</p>
        <Button
          className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => setDone(false)}
        >
          {t("joinTransportPage.submitAnother")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-extrabold text-primary">
        {t("joinTransportPage.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("joinTransportPage.subtitle")}</p>

      <Card className="mt-6 rounded-xl p-6 shadow-[var(--shadow-card)]">
        <form onSubmit={onSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="t-email">{t("joinTransportPage.emailLabel")}</Label>
            <Input
              id="t-email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
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
            <p className="text-xs text-muted-foreground">{t("joinTransportPage.notDriverHint")}</p>
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
    </div>
  );
}
