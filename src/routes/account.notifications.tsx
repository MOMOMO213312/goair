import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import {
  EmptyState,
  ListSkeleton,
  PageTitle,
  useAccountFormat,
} from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import {
  customerListNotifications,
  customerMarkNotificationsRead,
  type CustomerNotification,
} from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();
  const { fmtRelative } = useAccountFormat();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["customer", "notifications"],
    queryFn: () => customerListNotifications(50, 0),
    refetchInterval: 60_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["customer"] });
  const markAll = useMutation({
    mutationFn: () => customerMarkNotificationsRead(),
    onSuccess: refresh,
    onError: (err) => toast.error(err instanceof Error ? err.message : t("account.common.error")),
  });

  function text(n: CustomerNotification) {
    const vars = {
      ticket: String(n.data["ticket_code"] ?? ""),
      code: String(n.data["code"] ?? ""),
    };
    const titleKey = `account.notifications.${n.type}` as TranslationKey;
    const bodyKey = `account.notifications.${n.type}Body` as TranslationKey;
    const title = t(titleKey);
    const body = t(bodyKey, vars);
    return {
      title: title === titleKey ? t("account.notifications.generic") : title,
      body: body === bodyKey ? null : body,
    };
  }

  async function open(n: CustomerNotification) {
    if (!n.isRead) {
      try {
        await customerMarkNotificationsRead([n.id]);
        void refresh();
      } catch {
        /* best effort */
      }
    }
    if (n.linkPath) void navigate({ to: n.linkPath });
  }

  const hasUnread = (q.data ?? []).some((n) => !n.isRead);

  return (
    <div className="space-y-5">
      <PageTitle
        title={t("account.notifications.title")}
        subtitle={t("account.notifications.subtitle")}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!hasUnread || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" aria-hidden />
            {t("account.notifications.markAll")}
          </Button>
        }
      />
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <EmptyState icon={AlertCircle} title={t("account.common.error")}>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("account.common.retry")}
          </Button>
        </EmptyState>
      ) : q.data.length === 0 ? (
        <EmptyState icon={Bell} title={t("account.notifications.empty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {q.data.map((n) => {
            const { title, body } = text(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void open(n)}
                  className={cn(
                    "flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-secondary/60",
                    !n.isRead && "bg-primary/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.isRead ? "bg-transparent" : "bg-accent",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm text-foreground",
                        n.isRead ? "font-semibold" : "font-extrabold",
                      )}
                    >
                      {title}
                    </span>
                    {body ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{body}</span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">
                      {fmtRelative(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
