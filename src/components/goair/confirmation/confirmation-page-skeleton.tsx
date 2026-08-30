import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ConfirmationPageSkeleton() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="text-center">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-32" />
        <Skeleton className="mx-auto mt-2 h-8 w-48" />
        <Skeleton className="mx-auto mt-2 h-4 w-56" />
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <Skeleton className="h-28 w-full rounded-none" />
        <div className="space-y-4 p-6">
          <div className="flex justify-between">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-12 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <Skeleton className="mx-auto size-44 rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
