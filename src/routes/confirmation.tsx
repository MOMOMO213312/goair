import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { bookingField } from "@/components/goair/confirmation/confirmation-utils";
import { ConfirmationActions } from "@/components/goair/confirmation/confirmation-actions";
import { ConfirmationNextSteps } from "@/components/goair/confirmation/confirmation-next-steps";
import { ConfirmationNotFound } from "@/components/goair/confirmation/confirmation-not-found";
import { ConfirmationPageSkeleton } from "@/components/goair/confirmation/confirmation-page-skeleton";
import { ConfirmationSuccessHeader } from "@/components/goair/confirmation/confirmation-success-header";
import { ConfirmationTicketCard } from "@/components/goair/confirmation/confirmation-ticket-card";
import { fetchTrips, getBookingByTicket } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].confirmation.meta;

export const Route = createFileRoute("/confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: String(search["ticket"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: pageMeta.title },
      {
        name: "description",
        content: pageMeta.description,
      },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { t } = useTranslation();
  const { ticket } = Route.useSearch();

  const bookingQuery = useQuery({
    queryKey: ["goair", "booking", ticket],
    queryFn: () => getBookingByTicket(ticket),
    enabled: Boolean(ticket),
  });

  const tripsQuery = useQuery({
    queryKey: ["goair", "trips"],
    queryFn: fetchTrips,
    enabled: Boolean(bookingQuery.data),
  });

  const booking = bookingQuery.data;
  const tripId = booking ? bookingField(booking, ["trip_id"]) : "";
  const trip = tripsQuery.data?.find((item) => item.id === tripId);

  if (!ticket) {
    return (
      <div className="bg-mist/30 py-8">
        <ConfirmationNotFound />
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="bg-mist/30">
        <ConfirmationPageSkeleton />
      </div>
    );
  }

  if (bookingQuery.isError) {
    return (
      <div className="bg-mist/30 py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <h1 className="font-display text-xl font-bold text-primary">
            {t("confirmation.loadError.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("confirmation.loadError.description")}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-mist/30 py-8">
        <ConfirmationNotFound />
      </div>
    );
  }

  return (
    <div className="confirmation-page bg-mist/30 pb-12 pt-8 sm:pt-10">
      <div className="mx-auto max-w-xl px-4">
        <ConfirmationSuccessHeader booking={booking} />

        <ConfirmationTicketCard
          booking={booking}
          trip={trip}
          ticket={ticket}
          className="mt-8"
        />

        <ConfirmationNextSteps booking={booking} className="mt-6" />

        <ConfirmationActions ticket={ticket} className="mt-6 print:hidden" />
      </div>
    </div>
  );
}
