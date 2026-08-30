import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_AUTH_ERROR } from "@/lib/operator";

export function OperatorAuthError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card className="flex flex-col items-center gap-3 rounded-xl border-border/80 p-8 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="font-display text-lg font-bold text-primary">{message ?? OPERATOR_AUTH_ERROR}</p>
      </Card>
    </div>
  );
}
export function OperatorLoading() {
  return <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
}
export function OperatorSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}
export function OperatorStatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
