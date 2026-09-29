import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import {
  Bell,
  CarFront,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Plane,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";

import { CustomerLoginForm } from "@/components/account/login-form";
import { Button } from "@/components/ui/button";
import {
  customerGetOverview,
  customerSignOut,
  customerSyncAccount,
  useCustomerAuth,
} from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "حسابي — GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountLayout,
});

const NAV = [
  { to: "/account", key: "overview", icon: LayoutDashboard, exact: true },
  { to: "/account/trips", key: "trips", icon: Plane },
  { to: "/account/rentals", key: "rentals", icon: CarFront },
  { to: "/account/subscriptions", key: "subscriptions", icon: Sparkles },
  { to: "/account/payments", key: "payments", icon: CreditCard },
  { to: "/account/notifications", key: "notifications", icon: Bell },
  { to: "/account/profile", key: "profile", icon: UserRound },
] as const;

function AccountLayout() {
  const { ready, user } = useCustomerAuth();

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }
  if (!user) return <CustomerLoginForm />;
  return <AccountShell user={user} />;
}

function AccountShell({ user }: { user: User }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // Link old bookings made with this (verified) email and make sure the profile row exists.
  useEffect(() => {
    let active = true;
    customerSyncAccount()
      .then(() => {
        if (active) void qc.invalidateQueries({ queryKey: ["customer"] });
      })
      .catch(() => {
        /* the dashboard still works without the sync */
      });
    return () => {
      active = false;
    };
  }, [user.id, qc]);

  const overview = useQuery({
    queryKey: ["customer", "overview"],
    queryFn: customerGetOverview,
    staleTime: 30_000,
  });
  const unread = overview.data?.unreadNotifications ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="hidden rounded-2xl border border-border bg-card p-4 md:block">
            <p className="truncate text-xs font-semibold text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>

          <nav
            aria-label={t("account.nav.myAccount")}
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:mt-3 md:flex-col md:overflow-visible md:px-0"
          >
            {NAV.map(({ to, key, icon: Icon, ...rest }) => (
              <Link
                key={key}
                to={to}
                activeOptions={{ exact: "exact" in rest }}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <Icon className="size-4" aria-hidden />
                <span>{t(`account.nav.${key}` as const)}</span>
                {key === "notifications" && unread > 0 ? (
                  <span className="ms-auto rounded-full bg-accent px-1.5 text-[11px] font-extrabold leading-5 text-accent-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 hidden w-full justify-start gap-2 text-muted-foreground md:flex"
            onClick={() => void customerSignOut()}
          >
            <LogOut className="size-4" aria-hidden />
            {t("account.nav.signOut")}
          </Button>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
