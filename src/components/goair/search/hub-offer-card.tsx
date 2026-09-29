import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SearchCombobox } from "@/components/goair/search-combobox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAirportOffers,
  fetchHubOrigins,
  submitCustomRequest,
  type AirportOffer,
  type HubOrigin,
} from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

const VEHICLE_LABEL: Record<AirportOffer["vehicleCode"], { ar: string; en: string }> = {
  car: { ar: "سيارة", en: "Car" },
  van: { ar: "فان", en: "Van" },
  hiace: { ar: "هاي إيس", en: "Hiace" },
};

/**
 * Hub Mobility Master (2026-09 decision): lets a customer whose town isn't a
 * direct scheduled route today ("لسه مفيش رحلة معلنة") pick their city/area
 * and see which airports GoAir can move them to and at what price — real
 * data only (2026-09 pricing-model decision: no number without cost/history
 * behind it). Submits into the existing custom_requests flow; this never
 * touches trip/trip_options/booking, so it can't affect a real reservation.
 */
export function HubOfferCard({
  countryCode,
  referralCode,
}: {
  countryCode?: string;
  /** Explicit partner referral_code (e.g. from /partner/book's own auth),
   * overriding the customer's stored cookie code. Pass null/undefined on
   * the public site to fall back to whatever referral cookie is stored. */
  referralCode?: string | null;
}) {
  const { t, language } = useTranslation();
  const [origins, setOrigins] = useState<HubOrigin[]>([]);
  const [originId, setOriginId] = useState("");
  const [offers, setOffers] = useState<AirportOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetchHubOrigins(countryCode)
      .then((result) => {
        if (!cancelled) setOrigins(result);
      })
      .catch(() => {
        if (!cancelled) setOrigins([]);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    if (!originId) {
      setOffers([]);
      return;
    }
    let cancelled = false;
    setLoadingOffers(true);
    fetchAirportOffers(originId, referralCode)
      .then((result) => {
        if (!cancelled) setOffers(result);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOffers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originId, referralCode]);

  const originOptions = useMemo(
    () =>
      origins.map((o) => {
        const base = { value: o.originId, label: localize(o.nameAr, o.nameEn, language) };
        return o.role === "Feeder"
          ? { ...base, hint: localize(o.hubNameAr, null, language) }
          : base;
      }),
    [origins, language],
  );

  // Group hub-pickup offers by airport, each with its shared + private rows.
  const byAirport = useMemo(() => {
    const map = new Map<string, { name: string; isNearest: boolean; rows: AirportOffer[] }>();
    for (const offer of offers) {
      if (offer.pickupMode !== "hub") continue;
      const entry = map.get(offer.airportCode) ?? {
        name: offer.airportName,
        isNearest: offer.isNearest,
        rows: [],
      };
      entry.rows.push(offer);
      map.set(offer.airportCode, entry);
    }
    return Array.from(map.entries());
  }, [offers]);

  const selectedOrigin = origins.find((o) => o.originId === originId) ?? null;

  async function requestRide(offer: AirportOffer) {
    const key = `${offer.airportCode}|${offer.bookingType}|${offer.vehicleCode}`;
    if (name.trim().length < 2 || phone.trim().length < 7) {
      toast.error(t("search.customRequest.invalidName"));
      return;
    }
    setBusyKey(key);
    try {
      const vehicleLabel = localize(VEHICLE_LABEL[offer.vehicleCode].ar, VEHICLE_LABEL[offer.vehicleCode].en, language);
      const originLabel = selectedOrigin ? localize(selectedOrigin.nameAr, selectedOrigin.nameEn, language) : "";
      await submitCustomRequest({
        country: selectedOrigin?.countryCode ?? "",
        routeName: `${originLabel} — ${offer.airportName}`,
        preferredDate: new Date().toISOString().slice(0, 10),
        passengerName: name.trim(),
        phone: phone.trim(),
        pax: 1,
        preferredTimeNote:
          offer.priceUsd != null
            ? `Quoted ${offer.priceUsd}$ (${offer.priceUnit}, basis: ${offer.priceBasis}) — approx ${offer.distanceKmApprox}km`
            : `No price yet — approx ${offer.distanceKmApprox}km, awaiting supplier confirmation`,
        tier: `${offer.bookingType}/${offer.vehicleCode}`,
      });
      setSentKeys((prev) => new Set(prev).add(key));
      toast.success(t("search.customRequest.submitSuccess"));
      void vehicleLabel;
    } catch {
      toast.error(t("search.customRequest.submitError"));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Card className="mt-6 overflow-hidden rounded-xl border-border/80 p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-lg font-extrabold text-primary">
        {t("hubOffers.title")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("hubOffers.subtitle")}</p>

      <div className="mt-4 max-w-md">
        <SearchCombobox
          id="hub-origin"
          label={t("hubOffers.pickCity")}
          placeholder={t("hubOffers.pickCityPlaceholder")}
          options={originOptions}
          value={originId}
          onChange={setOriginId}
        />
      </div>

      {originId && loadingOffers ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("hubOffers.loading")}</p>
      ) : null}

      {originId && !loadingOffers && byAirport.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("hubOffers.none")}</p>
      ) : null}

      {byAirport.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 max-w-md sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hub-offer-name">{t("search.customRequest.nameLabel")}</Label>
              <Input id="hub-offer-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hub-offer-phone">{t("search.customRequest.phoneLabel")}</Label>
              <Input
                id="hub-offer-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 1XX XXX XXXX"
                className="h-10"
              />
            </div>
          </div>

          {byAirport.map(([code, group]) => (
            <div key={code} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-bold text-primary">{group.name}</span>
                {group.isNearest ? (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                    {t("hubOffers.nearest")}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.rows.map((offer) => {
                  const key = `${offer.airportCode}|${offer.bookingType}|${offer.vehicleCode}`;
                  const sent = sentKeys.has(key);
                  const vehicleLabel = localize(
                    VEHICLE_LABEL[offer.vehicleCode].ar,
                    VEHICLE_LABEL[offer.vehicleCode].en,
                    language,
                  );
                  const label =
                    offer.bookingType === "shared"
                      ? t("hubOffers.sharedSeat")
                      : `${t("hubOffers.private")} ${vehicleLabel}`;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex min-w-[168px] flex-col gap-1 rounded-md border border-border/70 p-2.5",
                        offer.priceUsd == null && "bg-secondary/30",
                      )}
                    >
                      <span className="text-xs font-bold text-muted-foreground">{label}</span>
                      {offer.priceUsd != null ? (
                        <span className="font-display text-base font-extrabold text-primary">
                          {t("hubOffers.approxFrom")} {offer.priceUsd}$
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {t("hubOffers.quoteRequired")}
                        </span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={offer.priceUsd != null ? "default" : "outline"}
                        disabled={busyKey === key || sent}
                        onClick={() => requestRide(offer)}
                        className="mt-1 h-8 text-xs font-bold"
                      >
                        {sent ? t("hubOffers.requested") : t("hubOffers.requestRide")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">{t("hubOffers.disclaimer")}</p>
        </div>
      ) : null}
    </Card>
  );
}
