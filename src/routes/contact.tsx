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

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — GoAir" },
      {
        name: "description",
        content: "كلمنا على واتساب أو ابعتلنا رسالة لأي استفسار عن حجزك أو مواعيد الرحلات.",
      },
      { property: "og:title", content: "تواصل معنا — GoAir" },
      { property: "og:description", content: "فريق الدعم متاح للرد على استفسارات الحجز والمواعيد." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("اكتب اسمك ورسالتك.");
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
      toast.success("وصلتنا رسالتك — هنرد في أسرع وقت.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "لم نتمكن من إرسال الرسالة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 lg:grid-cols-[1fr_280px]">
      <Card className="rounded-xl p-6 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-2xl font-extrabold text-primary">تواصل معنا</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          أي استفسار عن حجز أو موعد رحلة — ابعتلنا وهنرد بسرعة.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">الاسم</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">رقم الموبايل</Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">البريد الإلكتروني</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-msg">رسالتك</Label>
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
            إرسال
          </Button>
        </form>
      </Card>

      <Card className="h-fit rounded-xl bg-secondary/50 p-5">
        <p className="font-display text-sm font-bold text-primary">قنوات الدعم</p>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><MessageCircle className="size-4 text-accent" /> واتساب الدعم</li>
          <li className="flex items-center gap-2"><Phone className="size-4 text-accent" /> اتصال هاتفي</li>
          <li className="flex items-center gap-2"><Mail className="size-4 text-accent" /> البريد الإلكتروني</li>
        </ul>
      </Card>
    </div>
  );
}