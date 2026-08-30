import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      {[0, 1, 2, 3].map((index) => (
        <Card key={index} className="overflow-hidden border-border/80 p-0">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 space-y-4 p-5 sm:p-6">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-7 w-3/4 max-w-sm" />
              <Skeleton className="h-8 w-full max-w-md" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 w-24" />
              </div>
              <Skeleton className="h-4 w-2/3 max-w-xs" />
              <div className="flex gap-3 pt-2 md:hidden">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-11 flex-1" />
              </div>
            </div>
            <div className="hidden border-r border-border p-4 md:flex md:w-56 md:flex-col md:justify-between">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
