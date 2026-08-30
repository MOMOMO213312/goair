import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-4 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mx-auto mt-6 h-10 w-full max-w-md" />

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
        <Card className="hidden p-6 lg:block">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-4 h-32 w-full" />
          <Skeleton className="mt-4 h-10 w-full" />
        </Card>
      </div>
    </div>
  );
}
