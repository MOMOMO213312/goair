import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

type SearchEmptyStateProps = {
  title?: string;
  description?: string;
  showEditSearch?: boolean;
};

export function SearchEmptyState({
  title,
  description,
  showEditSearch = true,
}: SearchEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <EmptyState
        icon={SearchX}
        title={title ?? t("search.emptyState.title")}
        description={description ?? t("search.emptyState.description")}
      />
      {showEditSearch ? (
        <div className="flex justify-center">
          <Button asChild variant="outline" className="font-bold">
            <Link to="/">{t("search.editSearch")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
