import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].contactPage.meta;

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>) => ({
    package: typeof search["package"] === "string" ? search["package"] : undefined,
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
  component: ContactPage,
});

function ContactPage() {
  const { t } = useTranslation();
  const { package: packageName } = Route.useSearch();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: packageName ? t("contactPage.defaultMessage", { packageName }) : "",
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error(t("contactPage.missingFields"));
      return;
    }
    setBusy(true);
    try {
      await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      toast.success(t("contactPage.sendSuccess"));
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("contactPage.sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 lg:grid-cols-[1fr_280px]">
      <Card className="rounded-xl p-6 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-2xl font-extrabold text-primary">{t("contactPage.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("contactPage.subtitle")}
        </p>
        {packageName ? (
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-bold text-primary">
            {t("contactPage.aboutPackage", { packageName })}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">{t("contactPage.nameLabel")}</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">{t("contactPage.phoneLabel")}</Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">{t("contactPage.emailLabel")}</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-msg">{t("contactPage.messageLabel")}</Label>
            <Textarea
              id="c-msg"
              rows={5}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : null}
            {t("contactPage.submit")}
          </Button>
        </form>
      </Card>

      <Card className="h-fit rounded-xl bg-secondary/50 p-5">
        <p className="font-display text-sm font-bold text-primary">{t("contactPage.supportChannelsTitle")}</p>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><MessageCircle className="size-4 text-accent" /> {t("contactPage.whatsappChannel")}</li>
          <li className="flex items-center gap-2"><Phone className="size-4 text-accent" /> {t("contactPage.phoneChannel")}</li>
          <li className="flex items-center gap-2"><Mail className="size-4 text-accent" /> {t("contactPage.emailChannel")}</li>
        </ul>
      </Card>
    </div>
  );
}