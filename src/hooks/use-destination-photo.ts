import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Resolves the best available photo for a destination/route card.
 *
 * Priority: GoAir's own dedicated local photo (`dedicatedImage`, pass null
 * when this destination has none) → a real photo resolved server-side by
 * the `resolve-destination-photo` Edge Function, which searches Pexels
 * using a per-destination query and persists the result onto the
 * `destination_photos` table (keyed by country + location name) so the
 * same destination only ever triggers ONE real search, ever, across every
 * card it appears on for every visitor → `poolFallback` (the existing
 * deterministic per-country stock photo) while the Edge Function call is
 * in flight or if it comes back with nothing, so a card is never left
 * empty.
 *
 * This mirrors `useStockPhoto` (addon services / packages), adapted for
 * destinations, which aren't rows in their own table — they're aggregated
 * from `trip` — so the cache is keyed by (country, location_name) instead
 * of a single id.
 */
export function useDestinationPhoto(
  country: string,
  locationName: string,
  dedicatedImage: string | null,
  poolFallback: string | null,
): string | null {
  const { data } = useQuery({
    queryKey: ["destination-photo", country, locationName],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("resolve-destination-photo", {
        body: { country, locationName },
      });
      if (error) return null;
      return (data?.imageUrl as string | null) ?? null;
    },
    enabled: !dedicatedImage && Boolean(country) && Boolean(locationName),
    staleTime: Infinity,
    retry: false,
  });

  return dedicatedImage ?? data ?? poolFallback;
}
