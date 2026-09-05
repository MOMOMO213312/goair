import { Link } from "@tanstack/react-router";
import { Menu, Plane, Ticket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { to: "/", hash: undefined, label: "الرئيسية" },
  { to: "/", hash: "find-your-ride", label: "احجز رحلة" },
  { to: "/", hash: "services", label: "الخدمات" },
  { to: "/packages", hash: undefined, label: "العروض" },
  { to: "/my-bookings", hash: undefined, label: "رحلاتي" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              hash={link.hash}
              activeOptions={{ exact: link.to === "/" && !link.hash }}
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "text-primary bg-secondary" }}
            >
              {link.label}
            </Link>
          ))}
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
          {links.map((link) => (
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
