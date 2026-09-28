import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { NotificationItem } from "@/components/admin/notification-item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminToken } from "@/lib/admin-session";
import {
  adminGetNotificationSummary,
  adminListNotifications,
  adminMarkNotificationsRead,
  type AdminNotification,
} from "@/lib/admin-notifications";

const POLL_MS = 30_000;

/**
 * Bell in the admin top bar. Polls a tiny summary RPC every 30s (no realtime channel, so it
 * works with the locked-down tables), shows an unread badge, and pops open the latest items.
 * Also puts the unread count in the tab title and toasts when a new urgent item shows up.
 */
export function AdminNotificationBell() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const summary = useQuery({
    queryKey: ["admin-notification-summary", token],
    queryFn: () => adminGetNotificationSummary(token),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    retry: false,
    enabled: Boolean(token),
  });

  const list = useQuery({
    queryKey: ["admin-notifications", token, "bell"],
    queryFn: () => adminListNotifications(token, { limit: 8 }),
    enabled: Boolean(token) && open,
    retry: false,
  });

  const unread = summary.data?.unreadCount ?? 0;
  const urgent = summary.data?.urgentUnreadCount ?? 0;

  // Tab title: "(3) الإشعارات — لوحة تشغيل GoAir". Re-applied on route change because each
  // route sets its own <title>.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread, pathname]);

  // Toast only when the urgent count goes UP after the first load (not on page open).
  const prevUrgent = useRef<number | null>(null);
  useEffect(() => {
    if (!summary.data) return;
    if (prevUrgent.current !== null && urgent > prevUrgent.current) {
      toast.error("فيه إشعار عاجل جديد", {
        description: "افتح الجرس لمراجعته.",
        action: { label: "افتح", onClick: () => setOpen(true) },
      });
    }
    prevUrgent.current = urgent;
  }, [summary.data, urgent]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
    void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const markAll = useMutation({
    mutationFn: () => adminMarkNotificationsRead(token),
    onSuccess: refresh,
    onError: (err) => toast.error(err instanceof Error ? err.message : "حصل خطأ."),
  });

  async function openItem(n: AdminNotification) {
    setOpen(false);
    if (!n.isRead) {
      try {
        await adminMarkNotificationsRead(token, [n.id]);
        refresh();
      } catch {
        /* reading state is best-effort; still navigate */
      }
    }
    if (n.linkPath) void navigate({ to: n.linkPath });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-label={unread > 0 ? `الإشعارات — ${unread} غير مقروء` : "الإشعارات"}
          title="الإشعارات"
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? (
            <span
              className={
                "absolute -top-0.5 -end-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold leading-[18px] text-white " +
                (urgent > 0 ? "bg-red-600" : "bg-[var(--portal-accent,var(--accent))]")
              }
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="font-display text-sm font-extrabold text-slate-900">الإشعارات</p>
          <button
            type="button"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="flex items-center gap-1 text-xs font-bold text-[var(--portal-accent,var(--accent))] disabled:text-slate-300"
          >
            <CheckCheck className="size-4" aria-hidden />
            تعليم الكل كمقروء
          </button>
        </div>

        <div className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
          {list.isPending ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">جاري التحميل...</p>
          ) : list.isError ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              مقدرناش نحمّل الإشعارات. جرّب تاني.
            </p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">مفيش إشعارات لسه.</p>
          ) : (
            (list.data ?? []).map((n) => (
              <NotificationItem key={n.id} notification={n} onOpen={openItem} compact />
            ))
          )}
        </div>

        <Link
          to="/admin/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-bold text-[var(--portal-accent,var(--accent))] hover:bg-slate-50"
        >
          عرض كل الإشعارات
        </Link>
      </PopoverContent>
    </Popover>
  );
}
