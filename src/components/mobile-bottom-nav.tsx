import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Home, Search, Ticket } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

const TABS = [
  { to: "/" as const, icon: Home, key: "home", exact: true },
  { to: "/search" as const, icon: Search, key: "search", exact: false },
  { to: "/explore" as const, icon: Compass, key: "explore", exact: false },
  { to: "/my-bookings" as const, icon: Ticket, key: "bookings", exact: false },
] as const;

/**
 * App-style bottom tab bar shown only on small screens (mobile web / installed
 * PWA). Hidden on desktop (md:hidden) and automatically hidden on the internal
 * portal dashboards via the shared [data-site-chrome] rule in styles.css.
 */
export function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      data-site-chrome
      aria-label={t("bottomNav.home")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ to, icon: Icon, key, exact }) => {
          const isActive = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={key}
              to={to}
              activeOptions={{ exact }}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" aria-hidden strokeWidth={isActive ? 2.5 : 2} />
              {t(`bottomNav.${key}` as const)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
