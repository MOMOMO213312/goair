import destHaram from "@/assets/dest-haram.jpg";
import destJbeil from "@/assets/dest-jbeil.jpg";
import destNasr from "@/assets/dest-nasr-city.jpg";
import destSaida from "@/assets/dest-saida.jpg";
import destTripoli from "@/assets/dest-tripoli.jpg";
import destZamalek from "@/assets/dest-zamalek.jpg";
import egyptImage from "@/assets/route-egypt.jpg";
import lebanonImage from "@/assets/route-lebanon.jpg";
import heroImage from "@/assets/hero-airport.jpg";
import vehicleBus from "@/assets/vehicle-bus.jpg";
import vehicleHiace from "@/assets/vehicle-hiace.jpg";
import vehicleVan from "@/assets/vehicle-van.jpg";
import type { Trip } from "@/lib/goair";

/** Destination photos mapped to canonical city names from Supabase. */
export const DESTINATION_IMAGES: Record<string, string> = {
  "مدينة نصر": destNasr,
  الزمالك: destZamalek,
  الهرم: destHaram,
  جبيل: destJbeil,
  صيدا: destSaida,
  طرابلس: destTripoli,
};

/** Obvious naming variants → canonical destination keys (existing assets only). */
const DESTINATION_ALIASES: Record<string, keyof typeof DESTINATION_IMAGES> = {
  "مدينه نصر": "مدينة نصر",
  "مدينة  نصر": "مدينة نصر",
  هرم: "الهرم",
};

export const COUNTRY_IMAGES: Record<string, string> = {
  مصر: egyptImage,
  لبنان: lebanonImage,
};

/** Airport codes inherit their country's banner when no dedicated asset exists. */
const AIRPORT_COUNTRY: Record<string, string> = {
  CAI: "مصر",
  HBE: "مصر",
  HRG: "مصر",
  SSH: "مصر",
  SPX: "مصر",
  BEY: "لبنان",
};

function normalizeLocationName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function resolveDestinationImage(location: string): string | null {
  const normalized = normalizeLocationName(location);
  if (!normalized) return null;

  if (DESTINATION_IMAGES[normalized]) {
    return DESTINATION_IMAGES[normalized];
  }

  const aliasKey = DESTINATION_ALIASES[normalized];
  if (aliasKey && DESTINATION_IMAGES[aliasKey]) {
    return DESTINATION_IMAGES[aliasKey];
  }

  return null;
}

function isAirportLocation(
  name: string,
  trip: Pick<Trip, "airport_name" | "airport_code">,
): boolean {
  const normalized = normalizeLocationName(name);
  if (!normalized) return false;

  const airportName = normalizeLocationName(trip.airport_name);
  if (airportName && airportName === normalized) return true;
  if (normalized.includes("مطار")) return true;

  if (airportName) {
    if (airportName.includes(normalized) || normalized.includes(airportName)) {
      return true;
    }
  }

  return false;
}

/** City/area side of the route — the non-airport end when identifiable. */
export function getTripCityLocation(
  trip: Pick<Trip, "origin" | "destination" | "airport_name" | "airport_code">,
): string {
  const destinationIsAirport = isAirportLocation(trip.destination, trip);
  const originIsAirport = isAirportLocation(trip.origin, trip);

  if (destinationIsAirport && !originIsAirport) return trip.origin;
  if (originIsAirport && !destinationIsAirport) return trip.destination;
  if (!destinationIsAirport) return trip.destination;
  if (!originIsAirport) return trip.origin;
  return trip.destination;
}

export type RouteImageSource = Pick<
  Trip,
  "origin" | "destination" | "airport_name" | "airport_code" | "country"
>;

function resolveRouteImage(source: RouteImageSource): string | null {
  const city = getTripCityLocation(source);
  // No country-photo fallback here on purpose: only 6 of 60 real destinations
  // have a dedicated photo, so falling back to one of 2 country banners meant
  // the same photo repeated across ~90% of trip cards site-wide. A route
  // without its own photo shows the distinctive per-destination placeholder
  // instead (see DestinationPlaceholder) — never a repeated stock photo.
  return resolveDestinationImage(city);
}

/**
 * Best route image for a trip card: destination photo → null (placeholder).
 */
export function getTripRouteImage(trip: RouteImageSource): string | null {
  return resolveRouteImage(trip);
}

/**
 * Destination card image: named destination → null (placeholder). Same
 * reasoning as resolveRouteImage — no repeated country-banner fallback.
 */
export function getDestinationCardImage(
  destinationName: string,
  _country?: string,
): string | null {
  return resolveDestinationImage(destinationName);
}

/**
 * Route summary image when a full trip may be unavailable (e.g. payment/confirmation).
 */
export function getRouteImageFromTripOrFallback(
  trip: RouteImageSource | undefined,
  fallback: Partial<RouteImageSource> & { destination?: string; country?: string },
): string | null {
  if (trip) return resolveRouteImage(trip);

  const origin = fallback.origin ?? "";
  const destination = fallback.destination ?? "";
  const airport_name = fallback.airport_name ?? "";
  const airport_code = fallback.airport_code ?? "";
  const country = fallback.country ?? "";

  if (origin && destination && airport_name) {
    return resolveRouteImage({ origin, destination, airport_name, airport_code, country });
  }

  return getDestinationCardImage(destination, country || undefined);
}

export function getDestinationImage(destination: string): string | null {
  return resolveDestinationImage(destination);
}

export function getCountryImage(country: string): string {
  return COUNTRY_IMAGES[country] ?? heroImage;
}

export function getAirportImage(airportCode: string): string {
  const country = AIRPORT_COUNTRY[airportCode.toUpperCase()];
  if (country) return getCountryImage(country);
  return heroImage;
}

/**
 * INTERNAL / OPS USE ONLY — not for customer-facing UI.
 * GoAir sells a transfer, not a specific vehicle: the customer never sees
 * "van"/"hiace"/"bus" (see search-result-card.tsx, which shows a generic
 * "نقل مشترك" trip type instead). Kept here for future admin/ops screens
 * that DO need to show real fleet/vehicle info to staff or drivers.
 *
 * Vehicle photo for a trip option, chosen from its seat capacity.
 * Matches the exact tiers in `vehicle_types` (van=8, hiace=14, bus=50) —
 * no fabricated sedan tier. Falls back to the van photo (most common
 * tier) when capacity is unknown.
 */
export function getVehicleImage(capacity: number | null | undefined): string {
  if (capacity == null || capacity <= 8) return vehicleVan;
  if (capacity <= 14) return vehicleHiace;
  return vehicleBus;
}

/** Arabic label matching the vehicle photo tier — for alt text / badges. */
export function getVehicleLabel(capacity: number | null | undefined): string {
  if (capacity == null || capacity <= 8) return "فان";
  if (capacity <= 14) return "هاي إيس";
  return "أوتوبيس";
}
