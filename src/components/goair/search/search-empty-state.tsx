import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";

type SearchEmptyStateProps = {
  title?: string;
  description?: string;
  showEditSearch?: boolean;
};

export function SearchEmptyState({
  title = "مفيش رحلات متاحة حاليًا",
  description = "جرّب تغيير التاريخ أو الوجهة للعثور على خيارات أخرى.",
  showEditSearch = true,
}: SearchEmptyStateProps) {
  return (
    <div className="space-y-4">
      <EmptyState icon={SearchX} title={title} description={description} />
      {showEditSearch ? (
        <div className="flex justify-center">
          <Button asChild variant="outline" className="font-bold">
            <Link to="/">تعديل البحث</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
