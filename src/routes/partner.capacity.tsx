import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PartnerAuthError, PartnerSection, PartnerTempError } from "@/components/partner/partner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPartnerAuthError, submitCapacityForecast, todayIso } from "@/lib/partner";

export const Route = createFileRoute("/partner/capacity")({
  head: () => ({
    meta: [
      { title: "توقعات السعة — شركاء GoAir" },
      { name: "description", content: "أرسل توقعات عدد الرحلات والمسافرين للفترة القادمة." },
      { property: "og:title", content: "توقعات السعة — شركاء GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CapacityPage,
});

function CapacityPage() {
  const token = usePartnerToken();
  const [form, setForm] = useState({
    start: todayIso(),
    end: todayIso(),
    trips: "",
    passengers: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!token) return <PartnerAuthError />;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.start || !form.end || !form.trips || !form.passengers) {
      toast.error("اكمل كل الحقول.");
      return;
    }
    setBusy(true);
    setSubmitError(null);
    try {
      await submitCapacityForecast({
        token,
        periodStart: form.start,
        periodEnd: form.end,
        expectedTrips: Number(form.trips),
        expectedPassengers: Number(form.passengers),
      });
      setDone(true);
    } catch (error) {
      if (isPartnerAuthError(error)) {
        setSubmitError("auth");
      } else {
        setSubmitError("temp");
      }
    } finally {
      setBusy(false);
    }
  }

  if (submitError === "auth") return <PartnerAuthError />;

  if (done) {
    return (
      <PartnerSection title="التوقعات">
        <div className="flex items-center gap-3 text-primary">
          <CheckCircle2 className="size-6 text-accent" aria-hidden />
          <p className="font-semibold">استلمنا توقعاتك، فريقنا هيراجعها ويرد عليك قريبًا.</p>
        </div>
      </PartnerSection>
    );
  }

  return (
    <PartnerSection
      title="التوقعات"
      description="ساعدنا نجهّز المقاعد المناسبة لمسافريك في الفترة القادمة."
    >
      {submitError === "temp" ? (
        <div className="mb-4">
          <PartnerTempError />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pc-start">تاريخ بداية الفترة</Label>
            <Input
              id="pc-start"
              type="date"
              value={form.start}
              onChange={(event) => setForm({ ...form, start: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pc-end">تاريخ نهاية الفترة</Label>
            <Input
              id="pc-end"
              type="date"
              value={form.end}
              onChange={(event) => setForm({ ...form, end: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pc-trips">عدد الرحلات المتوقع</Label>
            <Input
              id="pc-trips"
              type="number"
              min={0}
              value={form.trips}
              onChange={(event) => setForm({ ...form, trips: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pc-pax">عدد المسافرين المتوقع</Label>
            <Input
              id="pc-pax"
              type="number"
              min={0}
              value={form.passengers}
              onChange={(event) => setForm({ ...form, passengers: event.target.value })}
            />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-11 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90 sm:w-auto"
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          إرسال التوقعات
        </Button>
      </form>
    </PartnerSection>
  );
}
