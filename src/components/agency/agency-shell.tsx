import { Link } from "@tanstack/react-router";
import { AlertCircle, CalendarRange, LayoutDashboard, PlusCircle, ScrollText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgencyDashboard } from "@/lib/agency";
import { AGENCY_AUTH_ERROR, agencyBookingStatusLabel } from "@/lib/agency";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/agency", label: "نظرة عامة", exact: true, icon: LayoutDashboard },
  { to: "/agency/book", label: "حجز سريع", icon: PlusCircle },
  { to: "/agency/bookings", label: "الحجوزات", icon: CalendarRange },
  { to: "/agency/statements", label: "كشوف الحساب", icon: ScrollText },
] as const;

export function AgencyNav({ token, variant = "tabs" }: { token: string; variant?: "tabs" | "sidebar" }) {
  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            search={{ token }}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          search={{ token }}
          activeOptions={{ exact: "exact" in item ? item.exact : false }}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AgencyAuthError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card className="flex flex-col items-center gap-3 rounded-xl border-border/80 p-8 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="font-display text-lg font-bold text-primary">
          {message ?? AGENCY_AUTH_ERROR}
        </p>
      </Card>
    </div>
  );
}

export function AgencyTempError({ message }: { message?: string }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{message ?? "حصل خطأ مؤقت. حاول مرة تانية."}</p>
    </Card>
  );
}

export function AgencyLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function AgencyOverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Card key={index} className="rounded-xl p-5 shadow-[var(--shadow-card)]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
        </Card>
      ))}
    </div>
  );
}

export function AgencyTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
      <span className="sr-only">{`Loading table with ${cols} columns`}</span>
    </div>
  );
}

export function AgencySection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function AgencyStatCard({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl p-5 shadow-[var(--shadow-card)]",
        highlight ? "border-accent/30 bg-primary text-primary-foreground" : "border-border/80 bg-card",
      )}
    >
      <p className={cn("text-sm", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      {hint ? (
        <p className={cn("mt-1 text-xs", highlight ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </Card>
  );
}

export function AgencyDashboardShell({
  token,
  data,
  children,
}: {
  token: string;
  data: AgencyDashboard;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-mist/30 pb-12 pt-6 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <AgencyHeader data={data} />
        <div className="mt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border border-border/80 bg-card p-3 shadow-[var(--shadow-card)]">
              <AgencyNav token={token} variant="sidebar" />
            </div>
          </aside>
          <div className="min-w-0">
            <AgencyNav token={token} variant="tabs" />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyHeader({ data }: { data: AgencyDashboard }) {
  return (
    <header className="rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.logoUrl && data.brandApproved ? (
            <img
              src={data.logoUrl}
              alt=""
              className="h-10 w-auto max-w-40 object-contain"
              loading="lazy"
            />
          ) : null}
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
              {data.agencyName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">لوحة تحكم وكالات السياحة الشريكة</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
            data.brandApproved
              ? "bg-primary text-primary-foreground"
              : "bg-accent/15 text-primary",
          )}
        >
          {data.brandApproved ? "الهوية معتمدة" : "الهوية قيد المراجعة"}
        </span>
      </div>
    </header>
  );
}

export function AgencyStatementStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "مسودة", className: "bg-muted text-muted-foreground" },
    sent: { label: "مرسل", className: "bg-accent/15 text-primary" },
    paid: { label: "مدفوع", className: "bg-primary text-primary-foreground" },
  };
  const entry = map[status.toLowerCase()] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", entry.className)}>
      {entry.label}
    </span>
  );
}

export function AgencyBookingStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-accent/15 text-primary",
    confirmed: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
    canceled: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        map[key] ?? "bg-muted text-muted-foreground",
      )}
    >
      {agencyBookingStatusLabel(status)}
    </span>
  );
}
