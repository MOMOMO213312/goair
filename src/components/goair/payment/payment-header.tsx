import { cn } from "@/lib/utils";

type PaymentHeaderProps = {
  className?: string;
};

export function PaymentHeader({ className }: PaymentHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">إتمام الدفع</h1>
      <p className="text-sm text-muted-foreground">
        راجع تفاصيل رحلتك واختر طريقة الدفع المناسبة
      </p>
    </header>
  );
}
