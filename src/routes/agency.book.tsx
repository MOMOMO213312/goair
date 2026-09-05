import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAgencyToken } from "@/lib/agency-session";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AgencyAuthError, AgencySection, AgencyTempError } from "@/components/agency/agency-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAgencyDashboard, isAgencyAuthError } from "@/lib/agency";
import {
  createBookingSafe,
  fetchScheduleOptions,
  fetchTrips,
  fetchVisibleCountries,
  formatTime,
  formatUsd,
  friendlyErrorMessage,
} from "@/lib/goair";

export const Route = createFileRoute("/agency/book")({
  head: () => ({
    meta: [
      { title: "حجز سريع للعميل — لوحة الوكالة" },
      { name: "description", content: "احجز رحلة نقل مطار بالنيابة عن عميلك مباشرة، معزوّة تلقائيًا لعمولة وكالتك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgencyQuickBookingPage,
});

function AgencyQuickBookingPage() {
  const token = useAgencyToken();

  const agencyQuery = useQuery({
    queryKey: ["agency-dashboard", token],
    queryFn: () => getAgencyDashboard(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <AgencyAuthError />;
  if (agencyQuery.isPending) return null;
  if (agencyQuery.isError || !agencyQuery.data) {
    return isAgencyAuthError(agencyQuery.error) ? <AgencyAuthError /> : <AgencyTempError />;
  }

  return <QuickBookingForm referralCode={agencyQuery.data.referralCode} />;
}

function QuickBookingForm({ referralCode }: { referralCode: string | null }) {
  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const countriesQuery = useQuery({
    queryKey: ["goair", "countries", tripsQuery.data?.length ?? 0],
    queryFn: () => fetchVisibleCountries(tripsQuery.data ?? []),
    enabled: Boolean(tripsQuery.data),
  });

  const [country, setCountry] = useState("");
  const [tripId, setTripId] = useState("");
  const [date, setDate] = useState("");
  const [scheduleKey, setScheduleKey] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [flight, setFlight] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const trips = tripsQuery.data ?? [];
  const tripsInCountry = useMemo(() => trips.filter((t) => t.country === country), [trips, country]);
  const selectedTrip = trips.find((t) => t.id === tripId);

  const scheduleQuery = useQuery({
    queryKey: ["agency-book-schedule", tripId, date],
    queryFn: () => fetchScheduleOptions(tripId, date, selectedTrip),
    enabled: Boolean(tripId && date),
  });
  const schedules = scheduleQuery.data ?? [];
  const selectedSchedule = schedules.find(
    (s) => `${s.scheduleId}|${s.departureTime}` === scheduleKey,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTrip || !selectedSchedule) {
      toast.error("اختار الرحلة والموعد الأول.");
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      toast.error("اكتب اسم الراكب ورقم تليفونه.");
      return;
    }
    setBusy(true);
    try {
      const { ticketCode } = await createBookingSafe({
        tripId: selectedTrip.id,
        scheduleId: selectedSchedule.scheduleId,
        tripOptionId: selectedSchedule.tripOptionId,
        travelDate: date,
        travelDatetime: `${date}T${selectedSchedule.departureTime}`,
        departureTime: selectedSchedule.departureTime.slice(0, 5),
        seatsCount: seats,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        flightNumber: flight.trim() || null,
        luggageCount: 0,
        referralCodeOverride: referralCode,
      });
      setResult(ticketCode);
      toast.success("تم إنشاء الحجز — الخطوة الجاية الدفع.");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من إنشاء الحجز."));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <AgencySection title="تم إنشاء الحجز">
        <p className="text-sm text-muted-foreground">
          كود التذكرة: <span className="font-display text-lg font-extrabold text-primary">{result}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          الحجز اتسجل معزوّ لوكالتك تلقائيًا. أكمل الدفع من صفحة{" "}
          <a href={`/payment?ticket=${result}`} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">
            الدفع
          </a>{" "}
          أو ابعتها لعميلك يكمّلها بنفسه.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setResult(null)}>
          حجز جديد
        </Button>
      </AgencySection>
    );
  }

  return (
    <AgencySection
      title="حجز سريع بالنيابة عن عميلك"
      description="هيتسجل تلقائيًا معزوّ لعمولة وكالتك — بدون ما العميل يحتاج يفتح الموقع."
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="الدولة">
          <Select value={country} onValueChange={(v) => { setCountry(v); setTripId(""); }}>
            <SelectTrigger><SelectValue placeholder="اختار الدولة" /></SelectTrigger>
            <SelectContent>
              {(countriesQuery.data ?? []).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="خط الرحلة">
          <Select value={tripId} onValueChange={setTripId} disabled={!country}>
            <SelectTrigger><SelectValue placeholder="اختار الخط" /></SelectTrigger>
            <SelectContent>
              {tripsInCountry.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.origin} ← {t.destination}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setScheduleKey(""); }} disabled={!tripId} />
        </Field>

        <Field label="الموعد">
          <Select value={scheduleKey} onValueChange={setScheduleKey} disabled={!date || schedules.length === 0}>
            <SelectTrigger><SelectValue placeholder={scheduleQuery.isFetching ? "جاري التحميل..." : "اختار الموعد"} /></SelectTrigger>
            <SelectContent>
              {schedules.map((s) => (
                <SelectItem key={`${s.scheduleId}|${s.departureTime}`} value={`${s.scheduleId}|${s.departureTime}`}>
                  {formatTime(s.departureTime) || s.departureTime.slice(0, 5)} — {formatUsd(s.pricePerSeat)}/راكب
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="اسم الراكب">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" />
        </Field>

        <Field label="رقم تليفون الراكب">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        </Field>

        <Field label="عدد المقاعد">
          <Input type="number" min={1} max={50} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} />
        </Field>

        <Field label="رقم رحلة الطيران (اختياري)">
          <Input value={flight} onChange={(e) => setFlight(e.target.value)} placeholder="MSXXX" />
        </Field>

        <Button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        >
          إنشاء الحجز
        </Button>
      </form>
    </AgencySection>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
