import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Building2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchPublicLaunchMarketCountries, fetchRentalVehicleCategories, sendRentalPartnerApplication } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].rentYourCarPage.meta;

export const Route = createFileRoute("/rent-your-car")({
  head: () => ({
    meta: [
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.description },
    ],
  }),
  component: RentYourCarPage,
});

const emptyForm = {
  providerType: "individual" as "individual" | "company",
  companyName: "",
  fleetSize: "",
  fullName: "",
  phone: "",
  email: "",
  country: "",
  city: "",
  carMakeModel: "",
  carYear: "",
  categoryId: "",
  hasDriverLicense: true,
  notes: "",
};

function RentYourCarPage() {
  const { t, language } = useTranslation();
  const categoriesQuery = useQuery({
    queryKey: ["goair", "rental-vehicle-categories"],
    queryFn: fetchRentalVehicleCategories,
  });
  const countriesQuery = useQuery({
    queryKey: ["goair", "public-launch-market-countries"],
    queryFn: fetchPublicLaunchMarketCountries,
  });
  const countries = countriesQuery.data ?? [];

  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const isCompany = form.providerType === "company";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isCompany) {
      if (!form.fullName.trim() || !form.phone.trim() || !form.country || !form.companyName.trim()) {
        toast.error(t("rentYourCarPage.companyMissingFields"));
        return;
      }
    } else if (!form.fullName.trim() || !form.phone.trim() || !form.country || !form.carMakeModel.trim()) {
      toast.error(t("rentYourCarPage.missingFields"));
      return;
    }
    setBusy(true);
    try {
      await sendRentalPartnerApplication({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        country: form.country,
        city: form.city.trim(),
        carMakeModel: form.carMakeModel.trim(),
        carYear: form.carYear.trim(),
        categoryId: form.categoryId,
        hasDriverLicense: form.hasDriverLicense,
        notes: form.notes.trim(),
        providerType: form.providerType,
        companyName: form.companyName.trim(),
        fleetSize: form.fleetSize.trim(),
      });
      setDone(true);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("rentYourCarPage.sendError"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-accent" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-primary">
          {t("rentYourCarPage.successTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("rentYourCarPage.successBody")}</p>
        <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setDone(false)}>
          {t("rentYourCarPage.submitAnother")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-extrabold text-primary">{t("rentYourCarPage.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("rentYourCarPage.subtitle")}</p>

      <Card className="mt-6 rounded-xl p-6 shadow-[var(--shadow-card)]">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>{t("rentYourCarPage.providerTypeLabel")}</Label>
            <RadioGroup
              value={form.providerType}
              onValueChange={(value) => setForm({ ...form, providerType: value as "individual" | "company" })}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  form.providerType === "individual" ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="individual" id="pt-individual" className="mt-0.5" />
                <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <User className="size-4" aria-hidden /> {t("rentYourCarPage.providerTypeIndividual")}
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  form.providerType === "company" ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="company" id="pt-company" className="mt-0.5" />
                <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Building2 className="size-4" aria-hidden /> {t("rentYourCarPage.providerTypeCompany")}
                </span>
              </label>
            </RadioGroup>
          </div>

          {isCompany ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-company-name">{t("rentYourCarPage.companyNameLabel")}</Label>
                <Input
                  id="r-company-name"
                  placeholder={t("rentYourCarPage.companyNamePlaceholder")}
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-fleet-size">{t("rentYourCarPage.fleetSizeLabel")}</Label>
                <Input
                  id="r-fleet-size"
                  inputMode="numeric"
                  value={form.fleetSize}
                  onChange={(event) => setForm({ ...form, fleetSize: event.target.value })}
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="r-name">{t("rentYourCarPage.nameLabel")}</Label>
              <Input
                id="r-name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-phone">{t("rentYourCarPage.phoneLabel")}</Label>
              <Input
                id="r-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-email">{t("rentYourCarPage.emailLabel")}</Label>
            <Input
              id="r-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("rentYourCarPage.countryLabel")}</Label>
              <Select value={form.country} onValueChange={(value) => setForm({ ...form, country: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("rentYourCarPage.countryPlaceholder")} />
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
              <Label htmlFor="r-city">{t("rentYourCarPage.cityLabel")}</Label>
              <Input
                id="r-city"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </div>
          </div>

          {!isCompany ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="r-car">{t("rentYourCarPage.carMakeModelLabel")}</Label>
                  <Input
                    id="r-car"
                    placeholder={t("rentYourCarPage.carMakeModelPlaceholder")}
                    value={form.carMakeModel}
                    onChange={(event) => setForm({ ...form, carMakeModel: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-year">{t("rentYourCarPage.carYearLabel")}</Label>
                  <Input
                    id="r-year"
                    inputMode="numeric"
                    value={form.carYear}
                    onChange={(event) => setForm({ ...form, carYear: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("rentYourCarPage.categoryLabel")}</Label>
                <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("rentYourCarPage.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {localize(category.label_ar, category.label_en, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <Label htmlFor="r-license" className="cursor-pointer">
                  {t("rentYourCarPage.hasDriverLicenseLabel")}
                </Label>
                <Switch
                  id="r-license"
                  checked={form.hasDriverLicense}
                  onCheckedChange={(checked) => setForm({ ...form, hasDriverLicense: checked })}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="r-notes">{t("rentYourCarPage.notesLabel")}</Label>
            <Textarea
              id="r-notes"
              rows={4}
              placeholder={t("rentYourCarPage.notesPlaceholder")}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </div>

          <p className="text-xs text-muted-foreground">{t("rentYourCarPage.reviewNote")}</p>

          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : null}
            {t("rentYourCarPage.submit")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
