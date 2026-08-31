import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { FlightPath } from "@/components/flight-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCustomRequest } from "@/lib/goair";

export type SearchParams = {
  country: string;
  airport: string;
  destination: string;
  date: string;
  seats: number;
  packageId?: string;
};

export function CustomRequestCard({ params }: { params: SearchParams }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (phone.trim().length < 7) {
      toast.error("اكتب رقم موبايل صحيح.");
      return;
    }
    setBusy(true);
    try {
      await submitCustomRequest({
        country: params.country,
        airportCode: params.airport,
        destination: params.destination,
        travelDate: params.date,
        seats: params.seats,
        phone: phone.trim(),
      });
      setDone(true);
      toast.success("وصلنا طلبك — هنكلمك على واتساب.");
    } catch {
      toast.error("لم نتمكن من إرسال الطلب. حاول مرة أخرى أو تواصل معنا.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 overflow-hidden rounded-xl border-border/80 shadow-[var(--shadow-card)]">
      <div className="bg-secondary/40 px-6 py-8 text-center">
        <FlightPath className="mx-auto h-10 w-56 text-accent/50" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-primary">
          مفيش مواعيد على الخط ده في اليوم المختار
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          اطلب الخط وسيب رقمك — فريقنا هيرجع لك بموعد مناسب.
        </p>
      </div>

      <div className="border-t border-border p-6">
        {done ? (
          <p className="text-center font-display font-bold text-accent">تم إرسال طلبك ✓</p>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto flex max-w-sm flex-col gap-3">
            <div className="space-y-2 text-start">
              <Label htmlFor="custom-request-phone">رقم الموبايل / واتساب</Label>
              <Input
                id="custom-request-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+20 1XX XXX XXXX"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="h-11 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              اطلب الخط ده
            </Button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Button asChild variant="link" className="font-bold text-accent">
            <Link to="/">تعديل البحث</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
