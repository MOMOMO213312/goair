import { AlertCircle } from "lucide-react";
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
    <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function GHStatCard({ label, value, tone }: { label: string; value: string | number; tone?: "urgent" | undefined }) {
  return (
    <Card className="rounded-xl border-border/80 p-4 text-center shadow-[var(--shadow-card)]">
      <p className={`font-display text-3xl font-extrabold ${tone === "urgent" ? "text-destructive" : "text-primary"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

export function GHEmpty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </Card>
  );
}
