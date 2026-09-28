import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAuthError, AdminLoading } from "@/components/admin/admin-shell";
import { NotificationItem } from "@/components/admin/notification-item";
import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAdminAuthError } from "@/lib/admin";
import { useAdminToken } from "@/lib/admin-session";
import {
  adminListNotifications,
  adminMarkNotificationsRead,
  type AdminNotification,
} from "@/lib/admin-notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [{ title: "الإشعارات — لوحة تشغيل GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: NotificationsPage,
});

const PAGE_SIZE = 30;

function NotificationsPage() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pages, setPages] = useState(1);

  const q = useQuery({
    queryKey: ["admin-notifications", token, "page", unreadOnly, pages],
    queryFn: () => adminListNotifications(token, { limit: PAGE_SIZE * pages, unreadOnly }),
    retry: false,
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
    void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const markAll = useMutation({
    mutationFn: () => adminMarkNotificationsRead(token),
    onSuccess: () => {
      toast.success("تم تعليم كل الإشعارات كمقروءة.");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حصل خطأ."),
  });

  if (!token) return null;
  if (q.isPending) return <AdminLoading />;
  if (q.isError) {
    return isAdminAuthError(q.error) ? (
      <AdminAuthError />
    ) : (
      <AdminAuthError message="حصل خطأ مؤقت." />
    );
  }

  const items = q.data;
  const hasMore = items.length >= PAGE_SIZE * pages;
  const hasUnread = items.some((n) => !n.isRead);

  async function openItem(n: AdminNotification) {
    if (!n.isRead) {
      try {
        await adminMarkNotificationsRead(token, [n.id]);
        refresh();
      } catch {
        /* best-effort */
      }
    }
    if (n.linkPath) void navigate({ to: n.linkPath });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="الإشعارات"
        subtitle="كل اللي محتاج انتباهك: دفعات، حجوزات، طلبات، وتنبيهات التشغيل. بتوصلك حسب دورك في الفريق."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={!hasUnread || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="gap-1.5"
          >
            <CheckCheck className="size-4" aria-hidden />
            تعليم الكل كمقروء
          </Button>
        }
      />

      <div className="flex gap-2" role="tablist" aria-label="تصفية الإشعارات">
        {[
          { key: false, label: "الكل" },
          { key: true, label: "غير المقروء" },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            role="tab"
            aria-selected={unreadOnly === tab.key}
            onClick={() => {
              setUnreadOnly(tab.key);
              setPages(1);
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
              unreadOnly === tab.key
                ? "border-transparent bg-[var(--portal-accent,var(--accent))] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 p-0 shadow-[var(--shadow-card)]">
        {items.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-slate-500">
            {unreadOnly
              ? "خلصت كل الإشعارات. مفيش حاجة غير مقروءة."
              : "مفيش إشعارات لسه. هتظهر هنا أول ما يحصل حدث محتاج متابعتك."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((n) => (
              <NotificationItem key={n.id} notification={n} onOpen={openItem} />
            ))}
          </div>
        )}
      </Card>

      {hasMore ? (
        <div className="text-center">
          <Button variant="outline" onClick={() => setPages((p) => p + 1)} disabled={q.isFetching}>
            عرض المزيد
          </Button>
        </div>
      ) : null}
    </div>
  );
}
