import { AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PortalCard, StatCard, StatusPill, statusTone } from "@/components/portal/portal-ui";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isPartnerLifecycleAlert,
  PARTNER_AUTH_ERROR,
  PARTNER_LIFECYCLE_STAGE_COUNT,
  partnerBookingStatusLabel,
  partnerLifecycleLabel,
  partnerLifecycleProgress,
} from "@/lib/partner";
import { cn } from "@/lib/utils";

export function PartnerAuthError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card className="flex flex-col items-center gap-3 rounded-xl border-border/80 p-8 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="font-display text-lg font-bold text-primary">
          {message ?? PARTNER_AUTH_ERROR}
        </p>
      </Card>
    </div>
  );
}

export function PartnerTempError({ message }: { message?: string }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{message ?? "حصل خطأ مؤقت. حاول مرة تانية."}</p>
    </Card>
  );
}

export function PartnerLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function PartnerOverviewSkeleton() {
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

export function PartnerTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
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

export function PartnerSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PortalCard title={title} description={description} className={className}>
      {children}
    </PortalCard>
  );
}

export function PartnerStatCard({
  label,
  value,
  hint,
  highlight = false,
  icon,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  highlight?: boolean;
  icon?: LucideIcon;
}) {
  return <StatCard label={label} value={value} hint={hint} highlight={highlight} icon={icon} />;
}

export function StatementStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { draft: "مسودة", sent: "مرسل", paid: "مدفوع" };
  const key = status.toLowerCase();
  return <StatusPill tone={key === "draft" ? "neutral" : statusTone(key)}>{labels[key] ?? status}</StatusPill>;
}

/** @deprecated Use StatementStatusBadge */
export function StatusBadge({ status }: { status: string }) {
  return <StatementStatusBadge status={status} />;
}

export function BookingStatusBadge({ status }: { status: string }) {
  return <StatusPill tone={statusTone(status)}>{partnerBookingStatusLabel(status)}</StatusPill>;
}

/**
 * Shows where a confirmed booking actually stands operationally — driver
 * assigned, on the way, picked up, completed — not just the yes/no booking
 * acceptance status from BookingStatusBadge. Only meaningful once a booking
 * is confirmed; cancelled bookings never reach dispatch.
 */
export function LifecycleBadge({
  status,
  driverName,
}: {
  status: string | null;
  driverName?: string | null;
}) {
  const alert = isPartnerLifecycleAlert(status);
  const progress = partnerLifecycleProgress(status);
  const isComplete = status?.toLowerCase() === "completed";

  return (
    <div className="flex flex-col gap-1.5">
      <StatusPill tone={alert ? "danger" : isComplete ? "success" : status ? "info" : "neutral"}>
        {partnerLifecycleLabel(status)}
      </StatusPill>
      {progress !== null && !alert ? (
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: PARTNER_LIFECYCLE_STAGE_COUNT }).map((_, index) => (
            <span
              key={index}
              className={cn("h-1 w-4 rounded-full", index <= progress ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      ) : null}
      {driverName ? (
        <span className="text-xs text-muted-foreground">السائق: {driverName}</span>
      ) : null}
    </div>
  );
}
