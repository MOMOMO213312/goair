import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

export function PaymentNotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <EmptyState
        icon={SearchX}
        title={t("payment.notFound.title")}
        description={t("payment.notFound.description")}
      />
      <Button asChild variant="outline" className="mt-6 font-bold">
        <Link to="/my-bookings">{t("payment.notFound.searchButton")}</Link>
      </Button>
    </div>
  );
}
