import { cn } from "@/lib/utils";

type BookingHeaderProps = {
  className?: string;
};

export function BookingHeader({ className }: BookingHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">إتمام الحجز</h1>
      <p className="text-sm text-muted-foreground">أدخل بيانات المسافرين لإتمام حجزك</p>
    </header>
  );
}
