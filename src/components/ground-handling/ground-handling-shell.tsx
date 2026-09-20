import { AlertCircle } from "lucide-react";
import { PortalCard, StatCard } from "@/components/portal/portal-ui";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GROUND_HANDLING_AUTH_ERROR } from "@/lib/ground-handling";

export function GHAuthError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card className="flex flex-col items-center gap-3 rounded-xl border-border/80 p-8 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="font-display text-lg font-bold text-primary">{message ?? GROUND_HANDLING_AUTH_ERROR}</p>
      </Card>
    </div>
  );
}

export function GHLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function GHSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PortalCard title={title} description={description} action={action}>
      {children}
    </PortalCard>
  );
}

export function GHStatCard({ label, value, tone }: { label: string; value: string | number; tone?: "urgent" | undefined }) {
  return (
    <StatCard
      label={label}
      value={value}
      className={tone === "urgent" ? "border-red-200 bg-red-50" : undefined}
      valueClassName={tone === "urgent" ? "text-red-600" : undefined}
    />
  );
}

export function GHEmpty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </Card>
  );
}
