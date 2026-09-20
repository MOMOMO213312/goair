import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Plane, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared shell for every GoAir portal (Partner, Operator, Ground Handling, Rental Provider, Admin):
 * dark themed sidebar + light top bar + content area. Each portal picks a theme; the theme is applied
 * as CSS variables (also on <html>, so dialogs/selects rendered in portals pick it up too).
 */

export type PortalTheme = "partner" | "operator" | "ground" | "rental" | "admin";

type ThemeTokens = { sidebar: string; accent: string; primary: string };

const THEMES: Record<PortalTheme, ThemeTokens> = {
  partner: { sidebar: "#032e57", accent: "#1677d6", primary: "#0a4a8f" },
  operator: { sidebar: "#073d55", accent: "#0a9aa5", primary: "#0a6470" },
  ground: { sidebar: "#182755", accent: "#6350cc", primary: "#3f3597" },
  rental: { sidebar: "#3b2b13", accent: "#e07b24", primary: "#a5540f" },
  admin: { sidebar: "#062342", accent: "#1f78d1", primary: "#0b3a6b" },
};

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};
export type PortalNavHeading = { heading: string };
export type PortalNavEntry = PortalNavItem | PortalNavHeading;

function isHeading(entry: PortalNavEntry): entry is PortalNavHeading {
  return "heading" in entry;
}

function themeVars(theme: PortalTheme): Record<string, string> {
  const t = THEMES[theme];
  return {
    "--portal-sidebar": t.sidebar,
    "--portal-accent": t.accent,
    "--primary": t.primary,
    "--accent": t.accent,
    "--accent-foreground": "#ffffff",
    "--shadow-card": "0 1px 2px rgb(15 23 42 / 0.05), 0 6px 16px -8px rgb(15 23 42 / 0.12)",
  };
}

function initialsOf(name: string | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "G";
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("");
}

type PortalShellProps = {
  theme: PortalTheme;
  /** Sidebar sub-title, e.g. "بوابة شركة النقل". */
  portalLabel: string;
  /** Role chip in the top bar, e.g. "شركة نقل". */
  roleLabel: string;
  /** Signed-in entity / person shown next to the avatar. */
  userName?: string | undefined;
  nav: PortalNavEntry[];
  onSignOut: () => void;
  children: ReactNode;
};

export function PortalShell({
  theme,
  portalLabel,
  roleLabel,
  userName,
  nav,
  onSignOut,
  children,
}: PortalShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const vars = useMemo(() => themeVars(theme), [theme]);

  // Hide the public site header/footer while a portal is mounted, and expose the theme to portals
  // rendered outside the shell (dialogs, selects, toasts).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset["portal"] = "true";
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
    return () => {
      delete root.dataset["portal"];
      for (const key of Object.keys(vars)) root.style.removeProperty(key);
    };
  }, [vars]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const items = nav.filter((entry): entry is PortalNavItem => !isHeading(entry));
  const activeItem = items
    .filter((item) =>
      item.exact
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)[0];

  const sidebar = (
    <SidebarBody
      portalLabel={portalLabel}
      nav={nav}
      onSignOut={onSignOut}
      onNavigate={() => setDrawerOpen(false)}
    />
  );

  return (
    <div
      className="min-h-screen bg-[#eef3f9] text-foreground lg:flex"
      style={vars as CSSProperties}
    >
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-[var(--portal-sidebar)] text-white lg:flex lg:flex-col">
        {sidebar}
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-[var(--portal-sidebar)] text-white shadow-2xl">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="absolute end-3 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="size-5" aria-hidden />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            aria-label="القائمة"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-extrabold text-slate-900">
              {activeItem?.label ?? portalLabel}
            </p>
            <p className="hidden truncate text-xs text-slate-500 sm:block">{portalLabel}</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 sm:inline-flex">
            <span className="size-2 rounded-full bg-[var(--portal-accent)]" aria-hidden />
            {roleLabel}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="flex size-9 items-center justify-center rounded-full bg-[var(--portal-accent)] text-sm font-extrabold text-white"
              title={userName}
              aria-hidden
            >
              {initialsOf(userName)}
            </span>
            {userName ? (
              <span className="hidden max-w-40 truncate text-sm font-bold text-slate-800 md:block">
                {userName}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  portalLabel,
  nav,
  onSignOut,
  onNavigate,
}: {
  portalLabel: string;
  nav: PortalNavEntry[];
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--portal-accent)] text-white shadow-lg">
          <Plane className="size-5 -rotate-45" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-extrabold leading-none tracking-wider">GOAIR</p>
          <p className="mt-1 truncate text-[11px] text-white/60">{portalLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={portalLabel}>
        {nav.map((entry, index) =>
          isHeading(entry) ? (
            <p
              key={`h-${entry.heading}`}
              className={cn(
                "px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-white/40",
                index === 0 ? "pt-1" : "pt-3",
              )}
            >
              {entry.heading}
            </p>
          ) : (
            <Link
              key={entry.to}
              to={entry.to}
              activeOptions={{ exact: entry.exact ?? false }}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white data-[status=active]:bg-[var(--portal-accent)] data-[status=active]:text-white data-[status=active]:shadow-md"
            >
              <entry.icon className="size-[18px] shrink-0" aria-hidden />
              <span className="truncate">{entry.label}</span>
            </Link>
          ),
        )}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-[18px] shrink-0" aria-hidden />
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}
