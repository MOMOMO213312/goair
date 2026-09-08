import { Badge } from "@/components/ui/badge";
import { normalizeBookingStatus } from "@/components/goair/confirmation/confirmation-utils";
import type { BookingRecord } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type ConfirmationStatusBadgeProps = {
  booking: BookingRecord | undefined;
  className?: string;
};

export function ConfirmationStatusBadge({ booking, className }: ConfirmationStatusBadgeProps) {
  const { t } = useTranslation();
  const status = normalizeBookingStatus(booking);
  const label = t(`confirmation.statusLabels.${status}`);

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-display text-xs font-bold",
        status === "confirmed" && "border-accent/30 bg-accent/15 text-primary",
        status === "pending" && "border-border bg-secondary text-primary",
        status === "cancelled" && "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
