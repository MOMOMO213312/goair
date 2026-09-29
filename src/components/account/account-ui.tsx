import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { useCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-display text-base font-bold text-foreground">{title}</p>
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
      ))}
    </div>
  );
}

export function RouteLabel({
  origin,
  destination,
  className,
}: {
  origin: string | null;
  destination: string | null;
  className?: string;
}) {
  const { dir } = useLanguage();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  if (!origin && !destination) return <span className={className}>—</span>;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span>{origin ?? "—"}</span>
      <Arrow className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span>{destination ?? "—"}</span>
    </span>
  );
}

/** Locale-aware formatters shared by every account page. */
export function useAccountFormat() {
  const { language } = useLanguage();
  const { formatDual } = useCurrency();
  const locale = language === "ar" ? "ar-EG" : "en-GB";

  const fmtDateTime = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    // plain YYYY-MM-DD dates must not shift with the viewer's timezone
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const fmtRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) return rtf.format(-days, "day");
    return fmtDate(iso);
  };

  const pick = (ar: string | null | undefined, en: string | null | undefined) =>
    (language === "en" ? en || ar : ar || en) ?? null;

  return { language, fmtDateTime, fmtDate, fmtRelative, money: formatDual, pick };
}
