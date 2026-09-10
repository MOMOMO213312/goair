import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { usePartnerToken } from "@/lib/partner-session";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardPaste, Lock, Users } from "lucide-react";

import { PartnerAuthError, PartnerSection, PartnerTempError } from "@/components/partner/partner-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getPartnerDashboard, isPartnerAuthError } from "@/lib/partner";
import {
  createBookingSafe,
  createPrivateBookingSafe,
  fetchPrivateTripOptions,
  fetchScheduleOptions,
  fetchTrips,
  fetchVisibleCountries,
  formatTime,
  formatUsd,
  friendlyErrorMessage,
  type PrivateOption,
} from "@/lib/goair";

export const Route = createFileRoute("/partner/book")({
  head: () => ({
    meta: [
      { title: "حجز سريع للعميل — لوحة الوكالة" },
      { name: "description", content: "احجز رحلة نقل مطار بالنيابة عن عميلك مباشرة، معزوّة تلقائيًا لعمولة وكالتك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerQuickBookingPage,
});

/**
 * Splits a pasted block of passenger names into a clean list — built for
 * pasting straight out of an Excel column or a hand-written list, not for
 * typing names one field at a time. Accepts one name per line (the normal
 * shape when you copy a spreadsheet column), or names separated by commas/
 * Arabic commas/semicolons on a single line, and strips "1.", "1-", "1)"
 * style numbering that often comes along with a paper list.
 */
function parsePassengerNames(raw: string): string[] {
  return raw
    .split(/[\n,،;]+/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\d+\s*[.\-)]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function PartnerQuickBookingPage() {
  const token = usePartnerToken();

  const partnerQuery = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) return <PartnerAuthError />;
  if (partnerQuery.isPending) return null;
  if (partnerQuery.isError || !partnerQuery.data) {
    return isPartnerAuthError(partnerQuery.error) ? <PartnerAuthError /> : <PartnerTempError />;
  }

  return <QuickBookingForm referralCode={partnerQuery.data.referralCode} />;
}

type BookingMode = "single" | "group";
type GroupType = "shared" | "private";

function QuickBookingForm({ referralCode }: { referralCode: string | null }) {
  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const countriesQuery = useQuery({
    queryKey: ["goair", "countries", tripsQuery.data?.length ?? 0],
    queryFn: () => fetchVisibleCountries(tripsQuery.data ?? []),
    enabled: Boolean(tripsQuery.data),
  });

  const [mode, setMode] = useState<BookingMode>("single");
  const [groupType, setGroupType] = useState<GroupType>("shared");

  const [country, setCountry] = useState("");
  const [tripId, setTripId] = useState("");
  const [date, setDate] = useState("");
  const [scheduleKey, setScheduleKey] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [flight, setFlight] = useState("");

  const [listNames, setListNames] = useState(false);
  const [passengerNamesText, setPassengerNamesText] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const trips = tripsQuery.data ?? [];
  const tripsInCountry = useMemo(() => trips.filter((t) => t.country === country), [trips, country]);
  const selectedTrip = trips.find((t) => t.id === tripId);

  const isPrivate = mode === "group" && groupType === "private";

  const scheduleQuery = useQuery({
    queryKey: ["partner-book-schedule", tripId, date],
    queryFn: () => fetchScheduleOptions(tripId, date, selectedTrip),
    enabled: Boolean(tripId && date) && !isPrivate,
  });
  const schedules = scheduleQuery.data ?? [];
  const selectedSchedule = schedules.find(
    (s) => `${s.scheduleId}|${s.departureTime}` === scheduleKey,
  );

  const privateOptionsQuery = useQuery({
    queryKey: ["partner-book-private-options", tripId],
    queryFn: () => fetchPrivateTripOptions(tripId),
    enabled: Boolean(tripId) && isPrivate,
  });
  const privateOptions = privateOptionsQuery.data ?? [];
  const selectedVehicle = privateOptions.find((v) => v.vehicleTypeId === vehicleTypeId);

  function resetTripDependentFields() {
    setScheduleKey("");
    setVehicleTypeId("");
  }

  function switchMode(next: BookingMode) {
    setMode(next);
    if (next === "single") setGroupType("shared");
    resetTripDependentFields();
  }

  function switchGroupType(next: GroupType) {
    setGroupType(next);
    resetTripDependentFields();
  }

  const parsedNames = useMemo(() => parsePassengerNames(passengerNamesText), [passengerNamesText]);
  const namesMatchSeats = parsedNames.length === seats;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      toast.error("اكتب اسم العميل المسؤول عن الجروب ورقم تليفونه.");
      return;
    }
    if (isPrivate) {
      if (!selectedVehicle) {
        toast.error("اختار نوع العربية للحجز الخاص.");
        return;
      }
      if (seats < 1 || seats > selectedVehicle.capacity) {
        toast.error(`عدد الركاب لازم يكون بين 1 و ${selectedVehicle.capacity} للعربية دي.`);
        return;
      }
    } else if (!selectedTrip || !selectedSchedule) {
      toast.error("اختار الرحلة والموعد الأول.");
      return;
    }
    if (listNames && !namesMatchSeats) {
      toast.error(`عدد الأسماء (${parsedNames.length}) لازم يطابق عدد الركاب (${seats}) بالظبط.`);
      return;
    }

    const passengerNames = listNames && namesMatchSeats ? parsedNames : null;

    setBusy(true);
    try {
      const { ticketCode } = isPrivate
        ? await createPrivateBookingSafe({
            tripId: selectedTrip!.id,
            vehicleTypeId: selectedVehicle!.vehicleTypeId,
            travelDate: date,
            travelDatetime: preferredTime ? `${date}T${preferredTime}` : null,
            seatsCount: seats,
            fullName: fullName.trim(),
            phoneNumber: phone.trim(),
            flightNumber: flight.trim() || null,
            luggageCount: 0,
            referralCodeOverride: referralCode,
            passengerNames,
          })
        : await createBookingSafe({
            tripId: selectedTrip!.id,
            scheduleId: selectedSchedule!.scheduleId,
            tripOptionId: selectedSchedule!.tripOptionId,
            travelDate: date,
            travelDatetime: `${date}T${selectedSchedule!.departureTime}`,
            departureTime: selectedSchedule!.departureTime.slice(0, 5),
            seatsCount: seats,
            fullName: fullName.trim(),
            phoneNumber: phone.trim(),
            flightNumber: flight.trim() || null,
            luggageCount: 0,
            referralCodeOverride: referralCode,
            passengerNames,
          });
      setResult(ticketCode);
      toast.success("تم إنشاء الحجز — الخطوة الجاية الدفع.");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "لم نتمكن من إنشاء الحجز."));
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setResult(null);
  }

  if (result) {
    return (
      <PartnerSection title="تم إنشاء الحجز">
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
        <Button className="mt-4" variant="outline" onClick={resetForm}>
          حجز جديد
        </Button>
      </PartnerSection>
    );
  }

  return (
    <PartnerSection
      title="حجز بالنيابة عن عميلك"
      description="هيتسجل تلقائيًا معزوّ لعمولة وكالتك — بدون ما العميل يحتاج يفتح الموقع."
    >
      <Tabs value={mode} onValueChange={(v) => switchMode(v as BookingMode)} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="single">حجز فردي</TabsTrigger>
          <TabsTrigger value="group">حجز جماعي</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "group" ? (
        <div className="mb-6 rounded-lg border border-border/80 bg-secondary/20 p-4">
          <p className="mb-3 text-sm font-bold text-primary">نوع الحجز الجماعي</p>
          <RadioGroup
            value={groupType}
            onValueChange={(v) => switchGroupType(v as GroupType)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                groupType === "shared" ? "border-accent bg-accent/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="shared" id="gt-shared" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <Users className="size-4" aria-hidden /> مقاعد مشتركة
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  تحجز عدد مقاعد للجروب ضمن رحلة ممكن يشاركها ركاب تانيين.
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                groupType === "private" ? "border-accent bg-accent/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="private" id="gt-private" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <Lock className="size-4" aria-hidden /> عربية خاصة كاملة
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  تحجز العربية بالكامل لجروب عميلك لوحدهم — سعر ثابت.
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="الدولة">
          <Select value={country} onValueChange={(v) => { setCountry(v); setTripId(""); resetTripDependentFields(); }}>
            <SelectTrigger><SelectValue placeholder="اختار الدولة" /></SelectTrigger>
            <SelectContent>
              {(countriesQuery.data ?? []).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="خط الرحلة">
          <Select value={tripId} onValueChange={(v) => { setTripId(v); resetTripDependentFields(); }} disabled={!country}>
            <SelectTrigger><SelectValue placeholder="اختار الخط" /></SelectTrigger>
            <SelectContent>
              {tripsInCountry.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.origin} ← {t.destination}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); resetTripDependentFields(); }} disabled={!tripId} />
        </Field>

        {isPrivate ? (
          <Field label="نوع العربية">
            <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} disabled={!date || privateOptions.length === 0}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    privateOptionsQuery.isFetching
                      ? "جاري التحميل..."
                      : privateOptions.length === 0 && date
                        ? "مفيش حجز خاص متاح للخط ده حاليًا"
                        : "اختار العربية"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {privateOptions.map((v: PrivateOption) => (
                  <SelectItem key={v.vehicleTypeId} value={v.vehicleTypeId}>
                    {v.vehicleLabelAr} — حتى {v.capacity} راكب — {formatUsd(v.priceUsd)} إجمالي
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
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
        )}

        {isPrivate ? (
          <Field label="الوقت المفضل (اختياري)">
            <Input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
          </Field>
        ) : null}

        <Field label="اسم العميل / المسؤول عن الحجز">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" />
        </Field>

        <Field label="رقم تليفون العميل">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        </Field>

        <Field label={isPrivate ? "عدد الركاب" : "عدد المقاعد"}>
          <Input
            type="number"
            min={1}
            max={isPrivate ? (selectedVehicle?.capacity ?? 50) : 50}
            value={seats}
            onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>

        <Field label="رقم رحلة الطيران (اختياري)">
          <Input value={flight} onChange={(e) => setFlight(e.target.value)} placeholder="MSXXX" />
        </Field>

        <div className="space-y-3 rounded-lg border border-dashed border-border p-4 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={listNames}
              onChange={(e) => setListNames(e.target.checked)}
              className="size-4 rounded border-border accent-accent"
            />
            <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <ClipboardPaste className="size-4" aria-hidden /> تسجيل اسم كل راكب في الجروب
            </span>
          </label>

          {listNames ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                الصق قائمة الأسماء زي ما هي من الإكسل أو الورقة — اسم في كل سطر (أو مفصولة بفاصلة)، وهنطابقها تلقائيًا مع عدد الركاب.
              </p>
              <Textarea
                value={passengerNamesText}
                onChange={(e) => setPassengerNamesText(e.target.value)}
                placeholder={"أحمد محمد\nسارة علي\nمحمود حسن\n..."}
                rows={Math.min(10, Math.max(4, seats))}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2 text-xs">
                {namesMatchSeats ? (
                  <span className="flex items-center gap-1 font-bold text-primary">
                    <CheckCircle2 className="size-3.5" aria-hidden /> {parsedNames.length} اسم — مطابق لعدد الركاب
                  </span>
                ) : (
                  <span className="font-bold text-accent">
                    {parsedNames.length} اسم من أصل {seats} مطلوب — لازم يتطابقوا بالظبط
                  </span>
                )}
              </div>
              {parsedNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parsedNames.map((name, i) => (
                    <Badge key={`${name}-${i}`} variant="secondary" className="font-normal">
                      {i + 1}. {name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              لو مقفول، هيتسجل بس اسم العميل المسؤول عن الحجز فوق، وباقي المقاعد من غير أسماء مربوطة.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        >
          {busy ? "جاري الحجز..." : "إنشاء الحجز"}
        </Button>
      </form>
    </PartnerSection>
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
