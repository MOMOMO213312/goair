import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useAdminToken } from "@/lib/admin-session";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminAddDriver,
  adminAddVehicle,
  adminListDrivers,
  adminListOperators,
  adminListVehicles,
  adminUpdateDriverCompliance,
  adminUpdateVehicleCompliance,
  getComplianceStatus,
  isAdminAuthError,
  type AdminDriver,
  type AdminVehicle,
  type ComplianceStatus,
} from "@/lib/admin";
import { fetchVisibleCountries, fetchVehicleTypes, fetchTrips } from "@/lib/goair";

export const Route = createFileRoute("/admin/fleet")({
  head: () => ({ meta: [{ title: "السائقين والعربيات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: FleetPage,
});

const COMPLIANCE_BADGE: Record<ComplianceStatus, { label: string; className: string }> = {
  unverified: { label: "بيانات ناقصة", className: "bg-mist text-muted-foreground" },
  valid: { label: "سارية", className: "bg-emerald-100 text-emerald-800" },
  expiring_soon: { label: "قربت تخلص", className: "bg-amber-100 text-amber-800" },
  expired: { label: "منتهية", className: "bg-red-100 text-red-800" },
};

function ComplianceBadge({ label, expiry }: { label: string; expiry: string | null }) {
  const status = getComplianceStatus(expiry);
  const badge = COMPLIANCE_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>
      {label}: {expiry ?? badge.label}
    </span>
  );
}

function FleetPage() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ["admin-drivers", token],
    queryFn: () => adminListDrivers(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["admin-vehicles", token],
    queryFn: () => adminListVehicles(token),
    retry: false,
    enabled: Boolean(token),
  });
  const operatorsQuery = useQuery({
    queryKey: ["admin-operators", token],
    queryFn: () => adminListOperators(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehicleTypesQuery = useQuery({ queryKey: ["goair", "vehicle-types"], queryFn: fetchVehicleTypes });
  const tripsQuery = useQuery({ queryKey: ["goair", "trips"], queryFn: fetchTrips });
  const countriesQuery = useQuery({
    queryKey: ["goair", "countries", tripsQuery.data?.length ?? 0],
    queryFn: () => fetchVisibleCountries(tripsQuery.data ?? []),
    enabled: Boolean(tripsQuery.data),
  });

  if (!token) return null;
  if (driversQuery.isPending || vehiclesQuery.isPending) return <AdminLoading />;
  if (driversQuery.isError || vehiclesQuery.isError) {
    const err = driversQuery.error ?? vehiclesQuery.error;
    return isAdminAuthError(err) ? <AdminAuthError /> : <AdminAuthError message="حصل خطأ مؤقت." />;
  }

  const refreshDrivers = () => queryClient.invalidateQueries({ queryKey: ["admin-drivers", token] });
  const refreshVehicles = () => queryClient.invalidateQueries({ queryKey: ["admin-vehicles", token] });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-extrabold text-primary">السائقين</h2>
        <AddDriverForm token={token} operators={operatorsQuery.data ?? []} onAdded={refreshDrivers} />
        <ul className="mt-5 divide-y divide-border/60">
          {(driversQuery.data ?? []).map((d) => (
            <DriverRow key={d.id} token={token} driver={d} onUpdated={refreshDrivers} />
          ))}
          {(driversQuery.data ?? []).length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">مفيش سائقين مضافين لسه.</li>
          ) : null}
        </ul>
      </Card>

      <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-extrabold text-primary">العربيات</h2>
        <AddVehicleForm
          token={token}
          vehicleTypes={vehicleTypesQuery.data ?? []}
          countries={countriesQuery.data ?? []}
          drivers={driversQuery.data ?? []}
          operators={operatorsQuery.data ?? []}
          onAdded={refreshVehicles}
        />
        <ul className="mt-5 divide-y divide-border/60">
          {(vehiclesQuery.data ?? []).map((v) => (
            <VehicleRow key={v.id} token={token} vehicle={v} onUpdated={refreshVehicles} />
          ))}
          {(vehiclesQuery.data ?? []).length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">مفيش عربيات مضافة لسه.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

function DriverRow({
  token,
  driver,
  onUpdated,
}: {
  token: string;
  driver: AdminDriver;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState(driver.license_number ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(driver.license_expiry ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateDriverCompliance(token, driver.id, {
        licenseNumber: licenseNumber.trim() || null,
        licenseExpiry: licenseExpiry || null,
        clearLicenseExpiry: !licenseExpiry,
      });
      toast.success("تم تحديث بيانات السواق.");
      setEditing(false);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-primary">{driver.full_name}</span>{" "}
          <span className="text-muted-foreground">
            — {driver.phone_number}{driver.operator_name ? ` — ${driver.operator_name}` : " — عربية GoAir مباشرة"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-bold text-accent underline-offset-2 hover:underline"
        >
          {editing ? "إلغاء" : "الرخصة"}
        </button>
      </div>
      <div className="mt-1.5">
        <ComplianceBadge label="الرخصة" expiry={driver.license_expiry} />
      </div>
      {editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-mist/40 p-2.5">
          <Input
            placeholder="رقم الرخصة"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="min-w-32 flex-1"
          />
          <Input
            type="date"
            value={licenseExpiry}
            onChange={(e) => setLicenseExpiry(e.target.value)}
            className="min-w-40 flex-1"
          />
          <Button type="button" size="sm" disabled={busy} onClick={save} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            حفظ
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function VehicleRow({
  token,
  vehicle,
  onUpdated,
}: {
  token: string;
  vehicle: AdminVehicle;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [registrationExpiry, setRegistrationExpiry] = useState(vehicle.registration_expiry ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(vehicle.insurance_expiry ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateVehicleCompliance(token, vehicle.id, {
        registrationExpiry: registrationExpiry || null,
        clearRegistrationExpiry: !registrationExpiry,
        insuranceExpiry: insuranceExpiry || null,
        clearInsuranceExpiry: !insuranceExpiry,
      });
      toast.success("تم تحديث بيانات العربية.");
      setEditing(false);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-primary">{vehicle.plate_number}</span>{" "}
          <span className="text-muted-foreground">
            — {vehicle.vehicle_label} ({vehicle.capacity} مقعد) — {vehicle.country}
            {vehicle.operator_name ? ` — ${vehicle.operator_name}` : " — GoAir مباشرة"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-bold text-accent underline-offset-2 hover:underline"
        >
          {editing ? "إلغاء" : "الترخيص والتأمين"}
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <ComplianceBadge label="الترخيص" expiry={vehicle.registration_expiry} />
        <ComplianceBadge label="التأمين" expiry={vehicle.insurance_expiry} />
      </div>
      {editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-mist/40 p-2.5">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] text-muted-foreground">تاريخ انتهاء الترخيص</label>
            <Input type="date" value={registrationExpiry} onChange={(e) => setRegistrationExpiry(e.target.value)} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] text-muted-foreground">تاريخ انتهاء التأمين</label>
            <Input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
          </div>
          <Button type="button" size="sm" disabled={busy} onClick={save} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            حفظ
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function AddDriverForm({
  token,
  operators,
  onAdded,
}: {
  token: string;
  operators: { id: string; name: string }[];
  onAdded: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error("اكتب الاسم ورقم التليفون.");
      return;
    }
    setBusy(true);
    try {
      await adminAddDriver(token, fullName.trim(), phone.trim(), operatorId || null);
      toast.success("تمت إضافة السائق.");
      setFullName("");
      setPhone("");
      onAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
      <Input placeholder="اسم السائق" value={fullName} onChange={(e) => setFullName(e.target.value)} className="min-w-40 flex-1" />
      <Input placeholder="رقم التليفون" value={phone} onChange={(e) => setPhone(e.target.value)} className="min-w-40 flex-1" />
      <Select value={operatorId} onValueChange={setOperatorId}>
        <SelectTrigger className="min-w-40 flex-1"><SelectValue placeholder="شركة النقل (اختياري — سيب فاضي لعربية GoAir)" /></SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
        إضافة
      </Button>
    </form>
  );
}

function AddVehicleForm({
  token,
  vehicleTypes,
  countries,
  drivers,
  operators,
  onAdded,
}: {
  token: string;
  vehicleTypes: { id: string; labelAr: string }[];
  countries: string[];
  drivers: { id: string; full_name: string }[];
  operators: { id: string; name: string }[];
  onAdded: () => void;
}) {
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [country, setCountry] = useState("");
  const [driverId, setDriverId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!plate.trim() || !vehicleTypeId || !country) {
      toast.error("املأ رقم اللوحة، نوع العربية، والدولة.");
      return;
    }
    setBusy(true);
    try {
      await adminAddVehicle(token, vehicleTypeId, plate.trim(), country, driverId || null, operatorId || null);
      toast.success("تمت إضافة العربية.");
      setPlate("");
      onAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="رقم اللوحة" value={plate} onChange={(e) => setPlate(e.target.value)} className="min-w-32 flex-1" />
        <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="نوع العربية" /></SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.labelAr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="الدولة" /></SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="السائق الأساسي (اختياري)" /></SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Select value={operatorId} onValueChange={setOperatorId}>
        <SelectTrigger className="min-w-32 flex-1"><SelectValue placeholder="شركة النقل (اختياري — سيب فاضي لعربية GoAir)" /></SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
        إضافة العربية
      </Button>
    </form>
  );
}
