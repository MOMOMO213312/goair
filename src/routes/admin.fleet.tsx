import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  isAdminAuthError,
} from "@/lib/admin";
import { fetchVisibleCountries, fetchVehicleTypes, fetchTrips } from "@/lib/goair";

export const Route = createFileRoute("/admin/fleet")({
  head: () => ({ meta: [{ title: "السائقين والعربيات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }] }),
  component: FleetPage,
});

function FleetPage() {
  const { token } = Route.useSearch();
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
            <li key={d.id} className="py-2.5 text-sm">
              <span className="font-bold text-primary">{d.full_name}</span>{" "}
              <span className="text-muted-foreground">
                — {d.phone_number}{d.operator_name ? ` — ${d.operator_name}` : " — عربية GoAir مباشرة"}
              </span>
            </li>
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
            <li key={v.id} className="py-2.5 text-sm">
              <span className="font-bold text-primary">{v.plate_number}</span>{" "}
              <span className="text-muted-foreground">
                — {v.vehicle_label} ({v.capacity} مقعد) — {v.country}
                {v.operator_name ? ` — ${v.operator_name}` : " — GoAir مباشرة"}
              </span>
            </li>
          ))}
          {(vehiclesQuery.data ?? []).length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">مفيش عربيات مضافة لسه.</li>
          ) : null}
        </ul>
      </Card>
    </div>
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
