import { normalizeBookingStatus } from "@/components/goair/confirmation/confirmation-utils";
import type { BookingRecord } from "@/lib/goair";
import { cn } from "@/lib/utils";

type ConfirmationNextStepsProps = {
  booking: BookingRecord | undefined;
  className?: string;
};

export function ConfirmationNextSteps({ booking, className }: ConfirmationNextStepsProps) {
  const status = normalizeBookingStatus(booking);

  return (
    <section className={cn("rounded-xl border border-border/80 bg-secondary/30 p-5", className)}>
      <h2 className="font-display text-base font-extrabold text-primary">ماذا بعد؟</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>احتفظ برقم الحجز ورمز QR للرجوع إليهما عند الحاجة.</li>
        {status === "pending" ? (
          <li>بعد مراجعة بيانات الدفع، سيقوم فريق GoAir بتأكيد حجزك.</li>
        ) : null}
        {status === "confirmed" ? (
          <li>نقطة الاستقبال بتظهر في رسالة واتساب قبل الرحلة.</li>
        ) : null}
        <li>السائق هيستناك مجانًا لحد ساعة بعد الهبوط الفعلي.</li>
      </ul>
    </section>
  );
}
