import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, Plane, Ticket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", hash: undefined, label: "الرئيسية" },
  { to: "/my-bookings", hash: undefined, label: "رحلاتي" },
] as const;

const EXPLORE_LINKS = [
  { tab: "packages", label: "الباقات" },
  { tab: "subscriptions", label: "الاشتراكات" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [exploreOpenMobile, setExploreOpenMobile] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isExploreActive = pathname.startsWith("/explore");

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="size-5 -rotate-45" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-primary">
            Go<span className="text-accent">Air</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            activeProps={{ className: "text-primary bg-secondary" }}
          >
            الرئيسية
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold outline-none transition-colors hover:bg-secondary hover:text-primary ${
                isExploreActive ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              استكشف
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              {EXPLORE_LINKS.map((item) => (
                <DropdownMenuItem key={item.tab} asChild>
                  <Link
                    to="/explore"
                    search={{ tab: item.tab }}
                    className="cursor-pointer text-sm font-semibold"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/my-bookings"
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            activeProps={{ className: "text-primary bg-secondary" }}
          >
            رحلاتي
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden gap-1.5 sm:inline-flex"
          >
            <Link to="/my-bookings">
              <Ticket className="size-4" aria-hidden />
              تتبع حجزي
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="القائمة"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            الرئيسية
          </Link>

          <button
            type="button"
            onClick={() => setExploreOpenMobile((value) => !value)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold ${
              isExploreActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            استكشف
            <ChevronDown
              className={`size-4 transition-transform ${exploreOpenMobile ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {exploreOpenMobile ? (
            <div className="mr-3 border-r border-border pr-3">
              {EXPLORE_LINKS.map((item) => (
                <Link
                  key={item.tab}
                  to="/explore"
                  search={{ tab: item.tab }}
                  onClick={() => {
                    setOpen(false);
                    setExploreOpenMobile(false);
                  }}
                  className="block rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground"
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          {links.slice(1).map((link) => (
            <Link
              key={link.label}
              to={link.to}
              hash={link.hash}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/my-bookings"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-1.5 rounded-md px-3 py-3 text-sm font-bold text-primary"
          >
            <Ticket className="size-4" aria-hidden />
            تتبع حجزي
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
