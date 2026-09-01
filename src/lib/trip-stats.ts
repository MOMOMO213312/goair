import type { Trip } from "@/lib/goair";

export type AirportSummary = {
  code: string;
  name: string;
  country: string;
  routeCount: number;
};

export type DestinationSummary = {
  name: string;
  country: string;
  airportCode: string;
  minPriceUsd: number | null;
  routeCount: number;
};

export type CountrySummary = {
  country: string;
  routeCount: number;
};

export function filterPublicTrips(trips: Trip[], countries: string[]): Trip[] {
  return trips.filter((trip) => countries.includes(trip.country));
}

export function getAirportSummaries(trips: Trip[], country?: string): AirportSummary[] {
  const filtered = country ? trips.filter((trip) => trip.country === country) : trips;
  const map = new Map<string, AirportSummary>();

  for (const trip of filtered) {
    const existing = map.get(trip.airport_code);
    if (existing) {
      existing.routeCount += 1;
    } else {
      map.set(trip.airport_code, {
        code: trip.airport_code,
        name: trip.airport_name,
        country: trip.country,
        routeCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function getCountrySummaries(trips: Trip[], countries: string[]): CountrySummary[] {
  return countries.map((country) => ({
    country,
    routeCount: trips.filter((trip) => trip.country === country).length,
  }));
}

export function getDestinationSummaries(trips: Trip[], countries: string[]): DestinationSummary[] {
  const visible = filterPublicTrips(trips, countries);
  const map = new Map<string, DestinationSummary>();

  for (const trip of visible) {
    const key = `${trip.country}::${trip.destination}`;
    const price = trip.price_usd;
    const existing = map.get(key);
    if (existing) {
      existing.routeCount += 1;
      if (price != null && (existing.minPriceUsd == null || price < existing.minPriceUsd)) {
        existing.minPriceUsd = price;
      }
    } else {
      map.set(key, {
        name: trip.destination,
        country: trip.country,
        airportCode: trip.airport_code,
        minPriceUsd: price,
        routeCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function getAirportsForCountry(trips: Trip[], country: string) {
  const map = new Map<string, string>();
  trips
    .filter((trip) => trip.country === country)
    .forEach((trip) => map.set(trip.airport_code, trip.airport_name));
  return Array.from(map, ([code, name]) => ({ code, name }));
}

/**
 * All destinations served from a specific airport, with price/route info —
 * used to let the customer pick a destination instead of assuming a single one.
 */
export function getDestinationSummariesForAirport(
  trips: Trip[],
  country: string,
  airportCode: string,
): DestinationSummary[] {
  const scoped = trips.filter(
    (trip) => trip.country === country && trip.airport_code === airportCode,
  );
  const map = new Map<string, DestinationSummary>();

  for (const trip of scoped) {
    const price = trip.price_usd;
    const existing = map.get(trip.destination);
    if (existing) {
      existing.routeCount += 1;
      if (price != null && (existing.minPriceUsd == null || price < existing.minPriceUsd)) {
        existing.minPriceUsd = price;
      }
    } else {
      map.set(trip.destination, {
        name: trip.destination,
        country: trip.country,
        airportCode: trip.airport_code,
        minPriceUsd: price,
        routeCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function getDestinationsForAirport(trips: Trip[], country: string, airportCode: string) {
  return Array.from(
    new Set(
      trips
        .filter((trip) => trip.country === country && trip.airport_code === airportCode)
        .map((trip) => trip.destination),
    ),
  ).sort((a, b) => a.localeCompare(b, "ar"));
}

/** Featured routes: lowest price first, capped for homepage display. */
export function getFeaturedRoutes(trips: Trip[], countries: string[], limit = 8): Trip[] {
  return filterPublicTrips(trips, countries)
    .slice()
    .sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity))
    .slice(0, limit);
}
