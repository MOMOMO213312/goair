import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { FlightPath } from "@/components/flight-path";
import type { SearchParams } from "@/components/goair/search/custom-request-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAirportOffers,
  fetchCountryAirports,
  fetchHubOrigins,
  submitCustomRequest,
} from "@/lib/goair";
import { getCountryIso } from "@/lib/i18n/country-labels";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

const VEHICLE_LABEL: Record<string, { ar: string; en: string }> = {
  car: { ar: "سيارة", en: "Car" },
  van: { ar: "فان", en: "Van" },
  hiace: { ar: "هاي إيس", en: "Hiace" },
};

type QuoteOption = {
  key: string;
  bookingType: "shared" | "private";
  vehicleCode: string | null;
  priceUsd: number | null;
  priceBasis: string | null;
  priceUnit: string | null;
  distanceKmApprox: number | null;
};

/**
 * Merged Hub search (2026-09 decision): shown on /search when the customer's
 * city + airport pair has no scheduled trip (e.g. Assiut -> Cairo airport).
 * It replaces the old standalone "no official line for your city?" section:
 * the direction, city and airport all come from the search the customer just
 * made, so nothing is asked twice. Prices are real-or-nothing — if there is no
 * supplier/historical basis for the pair we show "request a quote", never an
 * invented number. Submits into custom_requests only; never touches
 * trip / trip_options / booking.
 */
export function NoRouteQuoteCard({ params }: { params: SearchParams }) {
  const { t, language } = useTranslation();
  const direction = params.direction ?? "from_airport";
  const iso = getCountryIso(params.country);

  const airportsQuery = useQuery({
    queryKey: ["goair", "country-airports", iso],
    queryFn: () => fetchCountryAirports(iso!),
    enabled: Boolean(iso),
    staleTime: 60 * 60 * 1000,
  });
  const originsQuery = useQuery({
    queryKey: ["goair", "hub-origins", iso],
    queryFn: () => fetchHubOrigins(iso!),
    enabled: Boolean(iso),
    staleTime: 60 * 60 * 1000,
  });

  const airport = airportsQuery.data?.find((item) => item.code === params.airport) ?? null;
  const airportLabelAr = airport?.nameAr ?? airport?.nameEn ?? params.airport;
  const airportLabel = airport
    ? localize(airport.nameAr ?? airport.nameEn, airport.nameEn, language)
    : params.airport;

  const origin = originsQuery.data?.find((item) => item.nameAr === params.destination) ?? null;
  const cityLabel = origin
    ? localize(origin.nameAr, origin.nameEn, language)
    : params.destination;

  const offersQuery = useQuery({
    queryKey: ["goair", "airport-offers", origin?.originId ?? null],
    queryFn: () => fetchAirportOffers(origin!.originId),
    enabled: Boolean(origin),
  });

  const priced: QuoteOption[] = (offersQuery.data ?? [])
    .filter((offer) => offer.airportCode === params.airport && offer.pickupMode === "hub")
    .map((offer) => ({
      key: `${offer.bookingType}|${offer.vehicleCode}`,
      bookingType: offer.bookingType,
      vehicleCode: offer.vehicleCode,
      priceUsd: offer.priceUsd,
      priceBasis: offer.priceBasis,
      priceUnit: offer.priceUnit,
      distanceKmApprox: offer.distanceKmApprox,
    }));

  // No hub data for this pair (a free airport pick like Assiut -> Cairo):
  // there is no distance or cost basis, so both products are quote-only.
  const options: QuoteOption[] =
    priced.length > 0
      ? priced
      : (["shared", "private"] as const).map((bookingType) => ({
          key: `${bookingType}|any`,
          bookingType,
          vehicleCode: null,
          priceUsd: null,
          priceBasis: null,
          priceUnit: null,
          distanceKmApprox: null,
        }));

  const [selectedKey, setSelectedKey] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const activeKey = options.some((option) => option.key === selectedKey)
    ? selectedKey
    : (options[0]?.key ?? "");
  const active = options.find((option) => option.key === activeKey) ?? null;

  const routeText =
    direction === "to_airport"
      ? `${cityLabel} → ${airportLabel}`
      : `${airportLabel} → ${cityLabel}`;

  function optionLabel(option: QuoteOption) {
    if (option.bookingType === "shared") return t("hubOffers.sharedSeat");
    const vehicle = option.vehicleCode ? VEHICLE_LABEL[option.vehicleCode] : null;
    return vehicle
      ? `${t("hubOffers.private")} ${localize(vehicle.ar, vehicle.en, language)}`
      : t("hubOffers.private");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!active) return;
    if (name.trim().length < 2) {
      toast.error(t("search.customRequest.invalidName"));
      return;
    }
    if (phone.trim().length < 7) {
      toast.error(t("search.customRequest.invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      // route_name is read by the ops team, so it is always written in Arabic
      // with the direction spelled out (city -> airport or airport -> city).
      const routeName =
        direction === "to_airport"
          ? `${params.destination} → ${airportLabelAr}`
          : `${airportLabelAr} → ${params.destination}`;
      const noteParts = [
        active.priceUsd != null
          ? `Quoted ${active.priceUsd}$ (${active.priceUnit}, basis: ${active.priceBasis}) — approx ${active.distanceKmApprox}km`
          : "No price yet — awaiting supplier confirmation",
      ];
      if (params.flight) noteParts.push(`Flight ${params.flight}`);
      await submitCustomRequest({
        country: params.country,
        routeName,
        preferredDate: params.date,
        passengerName: name.trim(),
        phone: phone.trim(),
        pax: params.seats,
        preferredTimeNote: noteParts.join(" | "),
        tier: `${active.bookingType}/${active.vehicleCode ?? "any"}`,
        direction,
        airportCode: params.airport,
        originName: params.destination,
      });
      setDone(true);
      toast.success(t("search.customRequest.submitSuccess"));
    } catch {
      toast.error(t("search.customRequest.submitError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 overflow-hidden rounded-xl border-border/80 shadow-[var(--shadow-card)]">
      <div className="bg-secondary/40 px-6 py-8 text-center">
        <FlightPath className="mx-auto h-10 w-56 text-accent/50" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-primary">
          {t("noRouteQuote.title")}
        </h2>
        <p className="mt-2 font-display text-base font-bold text-primary">{routeText}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t("noRouteQuote.body")}
        </p>
      </div>

      <div className="border-t border-border p-6">
        {done ? (
          <p className="text-center font-display font-bold text-accent">
            {t("search.customRequest.submitted")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4">
            <div className="space-y-2 text-start">
              <Label>{t("noRouteQuote.chooseType")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedKey(option.key)}
                    aria-pressed={option.key === activeKey}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-start transition-colors",
                      option.key === activeKey
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-secondary/40",
                    )}
                  >
                    <span className="text-xs font-bold text-muted-foreground">
                      {optionLabel(option)}
                    </span>
                    {option.priceUsd != null ? (
                      <span className="font-display text-base font-extrabold text-primary">
                        {t("hubOffers.approxFrom")} {option.priceUsd}$
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {t("hubOffers.quoteRequired")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="no-route-name">{t("search.customRequest.nameLabel")}</Label>
              <Input
                id="no-route-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("search.customRequest.namePlaceholder")}
                className="h-11"
              />
            </div>
            <div className="space-y-2 text-start">
              <Label htmlFor="no-route-phone">{t("search.customRequest.phoneLabel")}</Label>
              <Input
                id="no-route-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+20 1XX XXX XXXX"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="h-11 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {t("noRouteQuote.submit")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("hubOffers.disclaimer")}</p>
          </form>
        )}
        <div className="mt-4 text-center">
          <Button asChild variant="link" className="font-bold text-accent">
            <Link to="/">{t("search.editSearch")}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
