import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Building blocks for portal home pages, matching the GoAir dashboard design. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
  delta,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  highlight?: boolean | undefined;
  /** Optional trend badge, e.g. { text: "+12%", positive: true }. */
  delta?: { text: string; positive?: boolean } | undefined;
  className?: string | undefined;
  valueClassName?: string | undefined;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border p-4 shadow-[var(--shadow-card)] sm:p-5",
        highlight
          ? "border-transparent bg-gradient-to-br from-[var(--portal-accent,var(--accent))] to-[var(--primary)] text-white"
          : "border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-semibold sm:text-sm",
            highlight ? "text-white/85" : "text-slate-500",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9",
              highlight
                ? "bg-white/15 text-white"
                : "bg-[var(--portal-accent,var(--accent))]/10 text-[var(--portal-accent,var(--accent))]",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl",
          highlight ? "text-white" : "text-slate-900",
          valueClassName,
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {delta ? (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-xs font-bold",
              delta.positive === false
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600",
            )}
          >
            {delta.text}
          </span>
        ) : null}
        {hint ? (
          <p className={cn("text-xs", highlight ? "text-white/75" : "text-slate-500")}>{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PortalCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}

/** Row used in "recent activity" style lists: title + subtitle on one side, pill/value on the other. */
export function ListRow({
  title,
  subtitle,
  end,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  end?: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {end ? <div className="shrink-0">{end}</div> : null}
    </li>
  );
}

const SUCCESS = ["confirmed", "completed", "paid", "approved", "verified", "active"];
const WARNING = ["pending", "requested", "preparing", "pending_review"];
const DANGER = [
  "cancelled",
  "canceled",
  "rejected",
  "no_show",
  "vehicle_issue",
  "delayed",
  "failed",
];
const INFO = [
  "accepted",
  "on_the_way",
  "picked_up",
  "in_progress",
  "staff_assigned",
  "driver_change",
  "sent",
];

/** Maps the status strings used across the portals to a pill colour (green / amber / red / blue). */
export function statusTone(status: string | null | undefined): PillTone {
  const key = (status ?? "").toLowerCase();
  if (SUCCESS.includes(key)) return "success";
  if (WARNING.includes(key)) return "warning";
  if (DANGER.includes(key)) return "danger";
  if (INFO.includes(key)) return "info";
  return "neutral";
}

export type DonutSlice = { label: string; value: number; color: string };

/** Small SVG donut with a legend, for distribution breakdowns (e.g. bookings by status). */
export function DonutChart({
  slices,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerLabel?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 120 120"
        className="size-36 shrink-0 -rotate-90"
        role="img"
        aria-label={centerLabel}
      >
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {total > 0
          ? slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="16"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })
          : null}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-slate-900 text-[18px] font-extrabold"
          transform="rotate(90 60 60)"
        >
          {total}
        </text>
      </svg>
      <ul className="min-w-40 flex-1 space-y-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              {slice.label}
            </span>
            <span className="font-bold text-slate-900">
              {slice.value}
              {total > 0 ? (
                <span className="ms-1 text-xs font-medium text-slate-400">
                  {Math.round((slice.value / total) * 100)}%
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
