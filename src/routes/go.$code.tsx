import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MapPin, PlaneLanding } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchQrTouchpointCatalog, createQrServiceSale, type QrTouchpointService } from "@/lib/goair";

export const Route = createFileRoute("/go/$code")({
  head: () => ({
    meta: [
      { title: "خدمات المطار — GoAir" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrRetailPage,
});

type Step = "browse" | "form" | "done";

function QrRetailPage() {
  const { code } = Route.useParams();
  const [step, setStep] = useState<Step>("browse");
  const [selected, setSelected] = useState<QrTouchpointService | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [voucher, setVoucher] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ["qr-touchpoint-catalog", code],
    queryFn: () => fetchQrTouchpointCatalog(code),
    retry: false,
  });

  const services = catalogQuery.data ?? [];
  const touchpointLabel = services[0]?.labelAr || services[0]?.airportCode || null;

  function pickService(service: QrTouchpointService) {
    setSelected(service);
    setStep("form");
  }

  async function confirmPurchase() {
    if (!selected) return;
    if (!name.trim()) {
      toast.error("محتاجين اسم الراكب.");
      return;
    }
    setBusy(true);
    try {
      const result = await createQrServiceSale({
        qrCode: code,
        groundHandlingServiceId: selected.serviceId,
        passengerName: name,
        passengerPhone: phone || null,
        flightNumber: flightNumber || null,
      });
      setVoucher(result.voucherCode);
      setStep("done");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ، حاول تاني.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col gap-4 px-4 py-8">
      <div className="text-center">
        <p className="font-display text-lg font-bold text-primary">GoAir — خدمات المطار</p>
        {touchpointLabel ? (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {touchpointLabel}
          </p>
        ) : null}
      </div>

      {catalogQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : catalogQuery.isError || services.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          الكود ده مش متاح دلوقتي، أو الخدمات في المكان ده مش شغالة حاليًا.
        </Card>
      ) : step === "browse" ? (
        <div className="space-y-3">
          {services.map((s) => (
            <Card
              key={s.serviceId}
              className="flex cursor-pointer items-center justify-between gap-3 p-4 shadow-[var(--shadow-card)] transition hover:border-primary"
              onClick={() => pickService(s)}
            >
              <div>
                <p className="font-bold text-primary">{s.serviceName}</p>
                {s.serviceDescription ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.serviceDescription}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-left">
                <p className="font-display text-lg font-bold">${s.priceUsd}</p>
                <Button size="sm" className="mt-1 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                  اختار
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : step === "form" && selected ? (
        <Card className="space-y-4 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-primary">
            <PlaneLanding className="h-5 w-5" />
            <p className="font-bold">{selected.serviceName} — ${selected.priceUsd}</p>
          </div>
          <div className="space-y-1.5">
            <Label>اسم الراكب</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم بالكامل" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم التليفون (اختياري)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم الرحلة (اختياري)</Label>
            <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="MS123" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("browse")} disabled={busy}>
              رجوع
            </Button>
            <Button
              className="flex-1 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
              onClick={confirmPurchase}
              disabled={busy}
            >
              {busy ? "بيتأكد..." : "تأكيد الطلب"}
            </Button>
          </div>
        </Card>
      ) : step === "done" ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center shadow-[var(--shadow-card)]">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="font-bold text-primary">تم تسجيل طلبك</p>
          <p className="text-sm text-muted-foreground">كود التأكيد بتاعك:</p>
          <p className="font-display text-2xl font-bold tracking-widest">{voucher}</p>
          <p className="text-xs text-muted-foreground">
            فريق الخدمة هيتواصل معاك لتأكيد الدفع وتجهيز الخدمة.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
