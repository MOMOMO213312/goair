import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";

type ChatWidgetMode = "customer" | "staff";

/**
 * Floating contact bubble shown on every page. Opens a small form and submits
 * to the same `contact_messages` table the /contact page already uses (via
 * sendContactMessage) — this is not a live chat, it's a lightweight "send us
 * a message" entry point staff can review from the admin contact-messages
 * queue. `mode` only changes the copy shown, not where the message goes.
 */
export function ChatWidget({ mode }: { mode: ChatWidgetMode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error(t("chatWidget.missingFields"));
      return;
    }
    setBusy(true);
    try {
      await sendContactMessage({
        name: form.name.trim(),
        email: "",
        phone: form.phone.trim(),
        message:
          mode === "staff"
            ? `[${t("chatWidget.staffTag")}] ${form.message.trim()}`
            : form.message.trim(),
      });
      setSent(true);
      setForm({ name: "", phone: "", message: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("chatWidget.sendError"));
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    setOpen((v) => !v);
    if (open) setSent(false);
  }

  return (
    <div className="fixed bottom-20 end-4 z-40 md:bottom-6 md:end-6">
      {open ? (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3">
            <p className="font-display text-sm font-extrabold text-primary-foreground">
              {t(mode === "staff" ? "chatWidget.staffTitle" : "chatWidget.title")}
            </p>
            <button
              type="button"
              aria-label={t("chatWidget.close")}
              onClick={toggle}
              className="rounded-lg p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="p-4">
            {sent ? (
              <div className="py-6 text-center">
                <p className="text-sm font-bold text-foreground">{t("chatWidget.sendSuccess")}</p>
                <Button type="button" size="sm" className="mt-4" onClick={() => setSent(false)}>
                  {t("chatWidget.sendAnother")}
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t(mode === "staff" ? "chatWidget.staffSubtitle" : "chatWidget.subtitle")}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="cw-name" className="text-xs">
                    {t("chatWidget.nameLabel")}
                  </Label>
                  <Input
                    id="cw-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cw-phone" className="text-xs">
                    {t("chatWidget.phoneLabel")}
                  </Label>
                  <Input
                    id="cw-phone"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cw-msg" className="text-xs">
                    {t("chatWidget.messageLabel")}
                  </Label>
                  <Textarea
                    id="cw-msg"
                    rows={3}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" aria-hidden />
                  )}
                  {t("chatWidget.submit")}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-label={t("chatWidget.open")}
        className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}
      </button>
    </div>
  );
}
