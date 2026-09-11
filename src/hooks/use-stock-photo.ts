import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

type StockPhotoTable = "addon_services" | "packages" | "subscription_plans" | "vehicle_types" | "vehicle_class_presentation";

/**
 * Resolves a real stock photo for a catalog row (addon service / package /
 * subscription plan).
 *
 * If the row already carries `existingImageUrl` (cached in the DB by a
 * previous resolution, or set manually from the admin), that's returned
 * immediately — no network call at all. Otherwise the `resolve-stock-photo`
 * Edge Function is invoked once: it searches Pexels server-side using the
 * row's `photo_query` and persists the result back onto the row, so every
 * catalog item only ever triggers a real search the FIRST time it's ever
 * rendered anywhere — after that it's a plain cached column read for
 * everyone. A brand-new item added later with no photo yet picks one up
 * automatically the first time its card is shown.
 */
export function useStockPhoto(
  table: StockPhotoTable,
  id: string,
  existingImageUrl: string | null,
): string | null {
  const { data } = useQuery({
    queryKey: ["stock-photo", table, id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("resolve-stock-photo", {
        body: { table, id },
      });
      if (error) return null;
      return (data?.imageUrl as string | null) ?? null;
    },
    enabled: !existingImageUrl && Boolean(id),
    staleTime: Infinity,
    retry: false,
  });

  return existingImageUrl ?? data ?? null;
}
