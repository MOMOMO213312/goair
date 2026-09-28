import {
  AlertTriangle,
  Bell,
  CarFront,
  CircleDollarSign,
  MessageSquare,
  Star,
  Ticket,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE_LABELS,
  timeAgoAr,
  type AdminNotification,
  type AdminNotificationSeverity,
} from "@/lib/admin-notifications";

const TYPE_ICONS: Record<string, LucideIcon> = {
  booking_new: Ticket,
  booking_cancelled: Ticket,
  payment_review: CircleDollarSign,
  payment_stale: CircleDollarSign,
  subscription_payment_review: CircleDollarSign,
  custom_request: MessageSquare,
  contact_message: MessageSquare,
  rental_application: CarFront,
  rental_vehicle: CarFront,
  low_rating: Star,
  gh_incident: AlertTriangle,
  departure_below_minimum: AlertTriangle,
  unassigned_soon: UserX,
};

const SEVERITY_STYLES: Record<AdminNotificationSeverity, { icon: string; dot: string }> = {
  info: { icon: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  warning: { icon: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  urgent: { icon: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function NotificationItem({
  notification,
  onOpen,
  compact = false,
}: {
  notification: AdminNotification;
  onOpen: (n: AdminNotification) => void;
  compact?: boolean;
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const styles = SEVERITY_STYLES[notification.severity];

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none",
        !notification.isRead && "bg-[var(--portal-accent,var(--accent))]/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
          styles.icon,
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm text-slate-900",
              notification.isRead ? "font-semibold" : "font-extrabold",
            )}
          >
            {notification.title}
          </span>
          {!notification.isRead ? (
            <span
              className={cn("size-2 shrink-0 rounded-full", styles.dot)}
              aria-label="غير مقروء"
            />
          ) : null}
        </span>
        {notification.body ? (
          <span
            className={cn(
              "mt-0.5 block text-xs text-slate-600",
              compact ? "line-clamp-2" : "line-clamp-3",
            )}
          >
            {notification.body}
          </span>
        ) : null}
        <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
          <span>{timeAgoAr(notification.createdAt)}</span>
          {!compact && NOTIFICATION_TYPE_LABELS[notification.type] ? (
            <>
              <span aria-hidden>•</span>
              <span>{NOTIFICATION_TYPE_LABELS[notification.type]}</span>
            </>
          ) : null}
        </span>
      </span>
    </button>
  );
}
