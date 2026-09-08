import { Loader2, Luggage, Pencil, Phone, Plane, User } from "lucide-react";

import { BookingCancellationNote } from "@/components/goair/booking/booking-cancellation-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BookingConfirmStepProps = {
  fullName: string;
  phone: string;
  flight: string;
  luggage: number;
  notes: string;
  packageName?: string;
  addonNames?: string[];
  onEditExtras: () => void;
  onEditPassengers: () => void;
  onConfirm: () => void;
  busy: boolean;
  className?: string;
};

/** Step 4 — final review before the booking is actually created and payment starts. */
export function BookingConfirmStep({
  fullName,
  phone,
  flight,
  luggage,
  notes,
  packageName,
  addonNames,
  onEditExtras,
  onEditPassengers,
  onConfirm,
  busy,
  className,
}: BookingConfirmStepProps) {
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">راجع بيانات حجزك</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        اتأكد إن كل حاجة مظبوطة قبل ما تكمل للدفع.
      </p>

      {/* Extras */}
      <div className="mt-6 rounded-xl border border-border/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-sm font-bold text-primary">الإضافات</p>
          <button
            type="button"
            onClick={onEditExtras}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <Pencil className="size-3.5" aria-hidden />
            تعديل
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">الباقة</dt>
            <dd className="font-bold text-primary">{packageName ?? "من غير إضافات"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Luggage className="size-4 text-accent" aria-hidden />
              الشنط
            </dt>
            <dd className="font-bold text-primary">{luggage}</dd>
          </div>
          {addonNames && addonNames.length > 0 ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">خدمات إضافية</dt>
              <dd className="max-w-[70%] text-end font-bold text-primary">{addonNames.join("، ")}</dd>
            </div>
          ) : null}
          {notes ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">ملاحظات</dt>
              <dd className="max-w-[70%] text-end text-primary">{notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Passenger */}
      <div className="mt-4 rounded-xl border border-border/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-sm font-bold text-primary">بيانات المسافر</p>
          <button
            type="button"
            onClick={onEditPassengers}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <Pencil className="size-3.5" aria-hidden />
            تعديل
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <User className="size-4 text-accent" aria-hidden />
              الاسم
            </dt>
            <dd className="font-bold text-primary">{fullName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-4 text-accent" aria-hidden />
              الموبايل
            </dt>
            <dd className="font-bold text-primary" dir="ltr">
              {phone}
            </dd>
          </div>
          {flight ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Plane className="size-4 text-accent" aria-hidden />
                رقم الرحلة
              </dt>
              <dd className="font-bold text-primary" dir="ltr">
                {flight}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="mt-6">
        <BookingCancellationNote />
      </div>

      <Button
        type="button"
        size="lg"
        disabled={busy}
        onClick={onConfirm}
        className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
      >
        {busy ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            جاري تثبيت الحجز...
          </>
        ) : (
          "تأكيد الحجز ومتابعة الدفع"
        )}
      </Button>
    </Card>
  );
}
