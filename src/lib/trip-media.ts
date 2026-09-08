import destHaram from "@/assets/dest-haram.jpg";
import destJbeil from "@/assets/dest-jbeil.jpg";
import destNasr from "@/assets/dest-nasr-city.jpg";
import destSaida from "@/assets/dest-saida.jpg";
import destTripoli from "@/assets/dest-tripoli.jpg";
import destZamalek from "@/assets/dest-zamalek.jpg";
import vehicleBus from "@/assets/vehicle-bus.jpg";
import vehicleHiace from "@/assets/vehicle-hiace.jpg";
import vehicleVan from "@/assets/vehicle-van.jpg";
import type { Trip } from "@/lib/goair";

const heroImage =
  "https://images.unsplash.com/photo-1566212774847-025968e5bf56?q=80&w=1920&auto=format&fit=crop";

const egyptImage =
  "https://images.unsplash.com/photo-1524686975162-f6fb4d39759c?q=80&w=1600&auto=format&fit=crop";

const lebanonImage =
  "https://images.unsplash.com/photo-1622142338658-eecd4db4e32f?q=80&w=1600&auto=format&fit=crop";

const destOctober =
  "https://images.unsplash.com/photo-1568322445389-f64ac2515020?q=80&w=1200&auto=format&fit=crop";

const destNewCairo =
  "https://images.unsplash.com/photo-1626692880062-35c360fb6afc?q=80&w=1200&auto=format&fit=crop";

const destBeirut =
  "https://images.unsplash.com/photo-1622142338658-eecd4db4e32f?q=80&w=1200&auto=format&fit=crop";

/** Destination photos mapped to canonical city names from Supabase. */
export const DESTINATION_IMAGES: Record<string, string> = {
  "مدينة نصر": destNasr,
  الزمالك: destZamalek,
  الهرم: destHaram,
  جبيل: destJbeil,
  صيدا: destSaida,
  طرابلس: destTripoli,
  "6 أكتوبر": destOctober,
  "٦ أكتوبر": destOctober,
  "القاهرة الجديدة": destNewCairo,
  بيروت: destBeirut,
};

/**
 * Real-photo pools used when a destination has no dedicated photo of its
 * own. Several photos per country (not one repeated banner) so a grid of
 * cards still looks varied and like a real travel site — a destination is
 * assigned a photo deterministically by name hash, so it never flickers
 * between renders.
 */
const EGYPT_PHOTO_POOL: string[] = [destHaram, destNasr, destZamalek, destOctober, destNewCairo, egyptImage];
const LEBANON_PHOTO_POOL: string[] = [destJbeil, destSaida, destTripoli, destBeirut, lebanonImage];

const COUNTRY_PHOTO_POOLS: Record<string, string[]> = {
  مصر: EGYPT_PHOTO_POOL,
  لبنان: LEBANON_PHOTO_POOL,
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function poolImageFor(destination: string, country?: string): string | null {
  if (!country) return null;
  const pool = COUNTRY_PHOTO_POOLS[country];
  if (!pool || pool.length === 0) return null;
  return pool[hashString(destination) % pool.length] ?? null;
}

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

/**
 * GoAir's own hand-picked photo for a destination, with no pool fallback —
 * returns null when this specific place has no dedicated asset. Used to
 * decide whether a card should try the real per-destination photo (via the
 * resolve-destination-photo Edge Function) instead of settling for the
 * repeated country pool image.
 */
function resolveDedicatedDestinationImage(location: string): string | null {
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

function resolveDestinationImage(location: string, country?: string): string | null {
  const dedicated = resolveDedicatedDestinationImage(location);
  if (dedicated) return dedicated;

  const normalized = normalizeLocationName(location);
  if (!normalized) return null;

  return poolImageFor(normalized, country);
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
  // Only 6 of 60 real destinations have a dedicated photo. Rather than fall
  // back to one repeated country banner (which looked identical across ~90%
  // of trip cards) or a plain color placeholder, unmatched destinations get
  // a deterministic pick from a small per-country pool of real travel
  // photos — varied, and still a real photo instead of an empty-feeling
  // gradient block.
  return resolveDestinationImage(city, source.country);
}

/**
 * Best route image for a trip card: destination photo → null (placeholder).
 */
export function getTripRouteImage(trip: RouteImageSource): string | null {
  return resolveRouteImage(trip);
}

/**
 * GoAir's own dedicated photo for a trip's city/area, or null — pass into
 * `useDestinationPhoto` alongside `getTripRouteImage`'s pool fallback so
 * routes without a dedicated asset get a real per-destination photo instead
 * of settling for the repeated country pool image.
 */
export function getDedicatedRouteImage(source: RouteImageSource): string | null {
  return resolveDedicatedDestinationImage(getTripCityLocation(source));
}

/**
 * Destination card image: named destination → per-country photo pool
 * fallback → null (placeholder), same as resolveRouteImage.
 */
export function getDestinationCardImage(
  destinationName: string,
  country?: string,
): string | null {
  return resolveDestinationImage(destinationName, country);
}

/**
 * GoAir's own dedicated photo for a destination card, or null if this
 * destination doesn't have one — pass this into `useDestinationPhoto` so it
 * knows to look up a real per-destination photo instead of falling back to
 * `getDestinationCardImage`'s repeated country pool image.
 */
export function getDedicatedDestinationImage(destinationName: string): string | null {
  return resolveDedicatedDestinationImage(destinationName);
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

/**
 * Dedicated-only counterpart to `getRouteImageFromTripOrFallback`, for
 * pages (payment/confirmation) that may only have the booking record, not
 * the full trip — same trip-or-fallback shape, no pool fallback.
 */
export function getDedicatedRouteImageFromTripOrFallback(
  trip: RouteImageSource | undefined,
  fallback: Partial<RouteImageSource> & { destination?: string; country?: string },
): string | null {
  if (trip) return getDedicatedRouteImage(trip);

  const origin = fallback.origin ?? "";
  const destination = fallback.destination ?? "";
  const airport_name = fallback.airport_name ?? "";
  const airport_code = fallback.airport_code ?? "";
  const country = fallback.country ?? "";

  if (origin && destination && airport_name) {
    return getDedicatedRouteImage({ origin, destination, airport_name, airport_code, country });
  }

  return getDedicatedDestinationImage(destination);
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
