import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useOperatorToken } from "@/lib/operator-session";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ComplianceBadge } from "@/components/goair/compliance-badge";
import { OperatorAuthError, OperatorLoading, OperatorSection } from "@/components/operator/operator-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getOperatorFleet,
  isOperatorAuthError,
  operatorAddDriver,
  operatorAddVehicle,
  operatorUpdateDriverCompliance,
  operatorUpdateVehicleCompliance,
  type OperatorDriver,
  type OperatorVehicle,
} from "@/lib/operator";
import { driverComplianceStatus, vehicleComplianceStatus } from "@/lib/compliance";
import { fetchVehicleTypes, fetchVisibleCountries, fetchTrips } from "@/lib/goair";

export const Route = createFileRoute("/operator/fleet")({
  head: () => ({ meta: [{ title: "أسطولي — بوابة شركة النقل" }, { name: "robots", content: "noindex" }] }),
  component: FleetPage,
});

function FleetPage() {
  const token = useOperatorToken();
  const qc = useQueryClient();
  const fleetQuery = useQuery({ queryKey: ["operator-fleet", token], queryFn: () => getOperatorFleet(token), retry: false, enabled: Boolean(token) });
  const vehicleTypesQuery = useQuery({ queryKey: ["goair", "vehicle-types"], queryFn: fetchVehicleTypes });
  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const countriesQuery = useQuery({
    queryKey: ["goair", "countries", tripsQuery.data?.length ?? 0],
    queryFn: () => fetchVisibleCountries(tripsQuery.data ?? []),
    enabled: Boolean(tripsQuery.data),
  });

  if (!token) return null;
  if (fleetQuery.isPending) return <OperatorLoading />;
  if (fleetQuery.isError) return isOperatorAuthError(fleetQuery.error) ? <OperatorAuthError /> : <OperatorAuthError message="حصل خطأ مؤقت." />;

  const refresh = () => qc.invalidateQueries({ queryKey: ["operator-fleet", token] });
  const drivers = fleetQuery.data?.drivers ?? [];
  const vehicles = fleetQuery.data?.vehicles ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OperatorSection title="السائقين">
        <AddDriverForm token={token} onAdded={refresh} />
        <ul className="mt-5 divide-y divide-border/60">
          {drivers.map((d) => (
            <DriverComplianceRow key={d.id} driver={d} token={token} onUpdated={refresh} />
          ))}
          {drivers.length === 0 ? <li className="py-4 text-center text-sm text-muted-foreground">مفيش سائقين مضافين لسه.</li> : null}
        </ul>
      </OperatorSection>
      <OperatorSection title="العربيات">
        <AddVehicleForm token={token} vehicleTypes={vehicleTypesQuery.data ?? []} countries={countriesQuery.data ?? []} drivers={drivers} onAdded={refresh} />
        <ul className="mt-5 divide-y divide-border/60">
          {vehicles.map((v) => (
            <VehicleComplianceRow key={v.id} vehicle={v} token={token} onUpdated={refresh} />
          ))}
          {vehicles.length === 0 ? <li className="py-4 text-center text-sm text-muted-foreground">مفيش عربيات مضافة لسه.</li> : null}
        </ul>
      </OperatorSection>
    </div>
  );
}

function DriverComplianceRow({ driver, token, onUpdated }: { driver: OperatorDriver; token: string; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState(driver.license_number ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(driver.license_expiry ?? "");
  const [busy, setBusy] = useState(false);
  const status = driverComplianceStatus(driver);

  async function save() {
    setBusy(true);
    try {
      await operatorUpdateDriverCompliance(token, driver.id, {
        licenseNumber: licenseNumber.trim() || null,
        licenseExpiry: licenseExpiry || null,
        clearLicenseExpiry: !licenseExpiry,
      });
      toast.success("تم تحديث بيانات السائق.");
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-bold text-primary">{driver.full_name}</span> <span className="text-muted-foreground">— {driver.phone_number}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ComplianceBadge status={status} />
          <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <Input placeholder="رقم الرخصة" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="min-w-32 flex-1" />
          <Input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} className="min-w-40 flex-1" aria-label="تاريخ انتهاء الرخصة" />
          <Button size="sm" disabled={busy} onClick={save} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">حفظ</Button>
        </div>
      ) : null}
    </li>
  );
}

function VehicleComplianceRow({ vehicle, token, onUpdated }: { vehicle: OperatorVehicle; token: string; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [registrationExpiry, setRegistrationExpiry] = useState(vehicle.registration_expiry ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(vehicle.insurance_expiry ?? "");
  const [busy, setBusy] = useState(false);
  const status = vehicleComplianceStatus(vehicle);

  async function save() {
    setBusy(true);
    try {
      await operatorUpdateVehicleCompliance(token, vehicle.id, {
        registrationExpiry: registrationExpiry || null,
        clearRegistrationExpiry: !registrationExpiry,
        insuranceExpiry: insuranceExpiry || null,
        clearInsuranceExpiry: !insuranceExpiry,
      });
      toast.success("تم تحديث بيانات العربية.");
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-bold text-primary">{vehicle.plate_number}</span> <span className="text-muted-foreground">— {vehicle.vehicle_label} ({vehicle.capacity} مقعد) — {vehicle.country}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ComplianceBadge status={status} />
          <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2.5">
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-muted-foreground">
            انتهاء الترخيص
            <Input type="date" value={registrationExpiry} onChange={(e) => setRegistrationExpiry(e.target.value)} />
          </label>
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-muted-foreground">
            انتهاء التأمين
            <Input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
          </label>
          <Button size="sm" disabled={busy} onClick={save} className="self-end bg-accent font-bold text-accent-foreground hover:bg-accent/90">حفظ</Button>
        </div>
      ) : null}
    </li>
  );
}

function AddDriverForm({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) { toast.error("اكتب الاسم ورقم التليفون."); return; }
    setBusy(true);
    try { await operatorAddDriver(token, fullName.trim(), phone.trim()); toast.success("تمت الإضافة."); setFullName(""); setPhone(""); onAdded(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <Input placeholder="اسم السائق" value={fullName} onChange={(e) => setFullName(e.target.value)} className="min-w-40 flex-1" />
      <Input placeholder="رقم التليفون" value={phone} onChange={(e) => setPhone(e.target.value)} className="min-w-40 flex-1" />
      <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">إضافة</Button>
    </form>
  );
}

function AddVehicleForm({ token, vehicleTypes, countries, drivers, onAdded }: {
  token: string; vehicleTypes: { id: string; labelAr: string }[]; countries: string[];
  drivers: { id: string; full_name: string }[]; onAdded: () => void;
}) {
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [country, setCountry] = useState("");
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim() || !vehicleTypeId || !country) { toast.error("املأ رقم اللوحة، نوع العربية، والدولة."); return; }
    setBusy(true);
    try { await operatorAddVehicle(token, vehicleTypeId, plate.trim(), country, driverId || null); toast.success("تمت الإضافة."); setPlate(""); onAdded(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="رقم اللوحة" value={plate} onChange={(e) => setPlate(e.target.value)} className="min-w-32 flex-1" />
        <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="نوع العربية" /></SelectTrigger>
          <SelectContent>{vehicleTypes.map((v) => <SelectItem key={v.id} value={v.id}>{v.labelAr}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="الدولة" /></SelectTrigger>
          <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="السائق (اختياري)" /></SelectTrigger>
          <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">إضافة العربية</Button>
    </form>
  );
}
