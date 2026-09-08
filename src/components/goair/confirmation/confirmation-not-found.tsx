import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

export function ConfirmationNotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <EmptyState
        icon={SearchX}
        title={t("confirmation.notFound.title")}
        description={t("confirmation.notFound.description")}
      />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="font-bold">
          <Link to="/my-bookings" search={{ ticket: "" }}>{t("confirmation.notFound.searchButton")}</Link>
        </Button>
        <Button asChild className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          <Link to="/">{t("confirmation.notFound.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
