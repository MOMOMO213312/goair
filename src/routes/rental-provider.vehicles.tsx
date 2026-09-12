import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import {
  RentalProviderAuthError,
  RentalProviderLoading,
  RentalProviderSection,
} from "@/components/rental-provider/rental-provider-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRentalProviderToken } from "@/lib/rental-provider-session";
import {
  addRentalProviderVehicle,
  APPROVAL_STATUS_LABELS,
  getRentalProviderProfile,
  isRentalProviderAuthError,
  listRentalProviderVehicles,
  MAX_VEHICLE_PHOTOS,
  updateRentalProviderVehicle,
  uploadRentalVehiclePhotos,
  type RentalProviderVehicle,
} from "@/lib/rental-provider";
import { fetchRentalVehicleCategories } from "@/lib/goair";

export const Route = createFileRoute("/rental-provider/vehicles")({
  head: () => ({ meta: [{ title: "عرباتي — بوابة مزوّد التأجير" }, { name: "robots", content: "noindex" }] }),
  component: RentalProviderVehiclesPage,
});

function RentalProviderVehiclesPage() {
  const token = useRentalProviderToken();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["rental-provider", "profile", token],
    queryFn: () => getRentalProviderProfile(token),
    retry: false,
    enabled: Boolean(token),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["rental-provider", "vehicles", token],
    queryFn: () => listRentalProviderVehicles(token),
    retry: false,
    enabled: Boolean(token),
  });
  const categoriesQuery = useQuery({
    queryKey: ["goair", "rental-vehicle-categories"],
    queryFn: fetchRentalVehicleCategories,
  });

  if (!token) return null;
  if (vehiclesQuery.isPending) return <RentalProviderLoading />;
  if (vehiclesQuery.isError) {
    return isRentalProviderAuthError(vehiclesQuery.error) ? (
      <RentalProviderAuthError />
    ) : (
      <RentalProviderAuthError message="حصل خطأ مؤقت." />
    );
  }

  const vehicles = vehiclesQuery.data ?? [];
  const country = profileQuery.data?.country ?? "";

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["rental-provider", "vehicles", token] });
  }

  return (
    <RentalProviderSection
      title="عرباتي"
      description="أي عربية جديدة أو أي تعديل عليها بيتبعت لمراجعة GoAir قبل ما يظهر للعملاء."
      action={
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">
              + إضافة عربية
            </Button>
          </DialogTrigger>
          <VehicleFormDialog
            token={token}
            country={country}
            categories={categoriesQuery.data ?? []}
            onDone={() => {
              setAddOpen(false);
              invalidate();
            }}
          />
        </Dialog>
      }
    >
      {vehicles.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">مفيش عربيات لسه — ضيف أول عربية.</p>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} token={token} onDone={invalidate} />
          ))}
        </div>
      )}
    </RentalProviderSection>
  );
}

function statusBadgeClass(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  return "bg-amber-100 text-amber-700";
}

function VehicleCard({
  vehicle,
  token,
  onDone,
}: {
  vehicle: RentalProviderVehicle;
  token: string;
  onDone: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await updateRentalProviderVehicle(token, vehicle.id, { isActive: !vehicle.isActive });
      toast.success(vehicle.isActive ? "العربية بقت غير نشطة." : "العربية بقت نشطة.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 rounded-xl border-border/80 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-primary">
          {vehicle.makeModel} — {vehicle.plateNumber}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {vehicle.dailyRateUsd}$/يوم
          {vehicle.hourlyRateUsd ? ` · ${vehicle.hourlyRateUsd}$/ساعة` : ""}
          {vehicle.multiDayRateUsd ? ` · ${vehicle.multiDayRateUsd}$/يوم (${vehicle.multiDayThresholdDays}+ أيام)` : ""}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusBadgeClass(vehicle.approvalStatus)}`}
        >
          {APPROVAL_STATUS_LABELS[vehicle.approvalStatus] ?? vehicle.approvalStatus}
        </span>
        {!vehicle.isActive ? (
          <span className="ms-2 mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
            متوقفة مؤقتًا
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={toggleActive}>
          {vehicle.isActive ? "إيقاف مؤقت" : "تفعيل"}
        </Button>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              تعديل
            </Button>
          </DialogTrigger>
          <EditVehicleDialog
            vehicle={vehicle}
            token={token}
            onDone={() => {
              setEditOpen(false);
              onDone();
            }}
          />
        </Dialog>
      </div>
    </Card>
  );
}

// منتقي صور بسيط: بيعرض الصور الموجودة (روابط) والصور المختارة لسه ماترفعتش
// (كملفات محلية) في نفس الشبكة، وبيسمح بإضافة/حذف لحد أقصى MAX_VEHICLE_PHOTOS.
function VehiclePhotoPicker({
  existingPhotos,
  onRemoveExisting,
  newFiles,
  onNewFilesChange,
}: {
  existingPhotos: string[];
  onRemoveExisting: (url: string) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingPhotos.length + newFiles.length;
  const canAddMore = totalCount < MAX_VEHICLE_PHOTOS;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const room = MAX_VEHICLE_PHOTOS - totalCount;
    if (room <= 0) {
      toast.error(`أقصى عدد صور للعربية ${MAX_VEHICLE_PHOTOS}.`);
      return;
    }
    onNewFilesChange([...newFiles, ...picked.slice(0, room)]);
  }

  return (
    <div className="space-y-2">
      <Label>صور العربية (اختياري — لحد {MAX_VEHICLE_PHOTOS})</Label>
      <div className="flex flex-wrap gap-2">
        {existingPhotos.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/80">
            <img src={url} alt="صورة العربية" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(url)}
              className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="حذف الصورة"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {newFiles.map((file, i) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={`${file.name}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/80">
              <img
                src={previewUrl}
                alt={file.name}
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
              <button
                type="button"
                onClick={() => onNewFilesChange(newFiles.filter((_, idx) => idx !== i))}
                className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="إلغاء الصورة"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {canAddMore ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">إضافة</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}

function VehicleFormDialog({
  token,
  country,
  categories,
  onDone,
}: {
  token: string;
  country: string;
  categories: { id: string; label_ar: string }[];
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [transmission, setTransmission] = useState("automatic");
  const [fuelType, setFuelType] = useState("petrol");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [multiDayRate, setMultiDayRate] = useState("");
  const [seats, setSeats] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("جاري الحفظ...");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !plateNumber.trim() || !makeModel.trim() || !dailyRate.trim()) {
      toast.error("الفئة، رقم اللوحة، الموديل، وسعر اليوم كلها مطلوبة.");
      return;
    }
    setBusy(true);
    try {
      let photos: string[] = [];
      if (photoFiles.length) {
        setBusyLabel("جاري رفع الصور...");
        photos = await uploadRentalVehiclePhotos(photoFiles);
      }
      setBusyLabel("جاري الحفظ...");
      await addRentalProviderVehicle(token, {
        categoryId,
        country,
        plateNumber: plateNumber.trim(),
        makeModel: makeModel.trim(),
        transmission,
        fuelType,
        dailyRateUsd: Number(dailyRate),
        hourlyRateUsd: hourlyRate.trim() ? Number(hourlyRate) : null,
        multiDayRateUsd: multiDayRate.trim() ? Number(multiDayRate) : null,
        seats: seats.trim() ? Number(seats) : null,
        description: description.trim() || null,
        photos,
      });
      toast.success("تمت إضافة العربية — هتبقى ظاهرة للعملاء بعد موافقة GoAir.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
      setBusyLabel("جاري الحفظ...");
    }
  }

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>إضافة عربية جديدة</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>الفئة</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="اختار الفئة" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="plate">رقم اللوحة</Label>
            <Input id="plate" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">الموديل</Label>
            <Input id="model" placeholder="Toyota Corolla 2023" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="hourly">سعر الساعة (اختياري)</Label>
            <Input id="hourly" inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily">سعر اليوم *</Label>
            <Input id="daily" inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiday">سعر لعدة أيام (اختياري)</Label>
            <Input id="multiday" inputMode="decimal" value={multiDayRate} onChange={(e) => setMultiDayRate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">عدد المقاعد (اختياري)</Label>
          <Input id="seats" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">وصف العربية (اختياري)</Label>
          <Textarea
            id="desc"
            rows={3}
            placeholder="اكتب تفاصيل بتفرّق عند الحجز: حالة العربية، مميزات جوّاها، شروط الاستخدام، أماكن التسليم المتاحة..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <VehiclePhotoPicker
          existingPhotos={[]}
          onRemoveExisting={() => {}}
          newFiles={photoFiles}
          onNewFilesChange={setPhotoFiles}
        />
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? busyLabel : "إضافة للمراجعة"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditVehicleDialog({
  vehicle,
  token,
  onDone,
}: {
  vehicle: RentalProviderVehicle;
  token: string;
  onDone: () => void;
}) {
  const [plateNumber, setPlateNumber] = useState(vehicle.plateNumber);
  const [makeModel, setMakeModel] = useState(vehicle.makeModel);
  const [dailyRate, setDailyRate] = useState(String(vehicle.dailyRateUsd));
  const [hourlyRate, setHourlyRate] = useState(vehicle.hourlyRateUsd != null ? String(vehicle.hourlyRateUsd) : "");
  const [multiDayRate, setMultiDayRate] = useState(vehicle.multiDayRateUsd != null ? String(vehicle.multiDayRateUsd) : "");
  const [description, setDescription] = useState(vehicle.description ?? "");
  const [existingPhotos, setExistingPhotos] = useState<string[]>(vehicle.photos ?? []);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("جاري الحفظ...");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let photos = existingPhotos;
      if (newPhotoFiles.length) {
        setBusyLabel("جاري رفع الصور...");
        const uploaded = await uploadRentalVehiclePhotos(newPhotoFiles);
        photos = [...existingPhotos, ...uploaded];
      }
      setBusyLabel("جاري الحفظ...");
      await updateRentalProviderVehicle(token, vehicle.id, {
        plateNumber: plateNumber.trim(),
        makeModel: makeModel.trim(),
        dailyRateUsd: Number(dailyRate),
        hourlyRateUsd: hourlyRate.trim() ? Number(hourlyRate) : null,
        multiDayRateUsd: multiDayRate.trim() ? Number(multiDayRate) : null,
        description: description.trim() || null,
        photos,
      });
      toast.success("اتحفظ التعديل — هيرجع للمراجعة قبل ما يظهر تاني.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حصل خطأ.");
    } finally {
      setBusy(false);
      setBusyLabel("جاري الحفظ...");
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>تعديل {vehicle.makeModel}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="e-plate">رقم اللوحة</Label>
            <Input id="e-plate" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-model">الموديل</Label>
            <Input id="e-model" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="e-hourly">سعر الساعة</Label>
            <Input id="e-hourly" inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-daily">سعر اليوم</Label>
            <Input id="e-daily" inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-multiday">سعر لعدة أيام</Label>
            <Input id="e-multiday" inputMode="decimal" value={multiDayRate} onChange={(e) => setMultiDayRate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-desc">الوصف</Label>
          <Textarea id="e-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <VehiclePhotoPicker
          existingPhotos={existingPhotos}
          onRemoveExisting={(url) => setExistingPhotos((prev) => prev.filter((p) => p !== url))}
          newFiles={newPhotoFiles}
          onNewFilesChange={setNewPhotoFiles}
        />
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
            {busy ? busyLabel : "حفظ التعديل"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
