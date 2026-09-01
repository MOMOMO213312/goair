import { useEffect, useState } from "react";

import { getWikiPlacePhoto } from "@/lib/wiki-image";

/**
 * Resolves the best available photo for a destination/route card.
 *
 * Priority: GoAir's own curated local photo (passed in as `localImage`) →
 * a real photo fetched from Wikipedia for `placeName` → null, in which case
 * the caller falls back to the gradient placeholder. This means the plain
 * placeholder only ever shows for places with no photo anywhere, instead of
 * for every destination GoAir hasn't hand-photographed yet.
 */
export function useDestinationPhoto(
  localImage: string | null,
  placeName: string,
  country: string,
): string | null {
  const [remoteImage, setRemoteImage] = useState<string | null>(null);

  useEffect(() => {
    if (localImage || !placeName) {
      setRemoteImage(null);
      return;
    }

    let cancelled = false;
    getWikiPlacePhoto(placeName, country).then((url) => {
      if (!cancelled) setRemoteImage(url);
    });

    return () => {
      cancelled = true;
    };
  }, [localImage, placeName, country]);

  return localImage ?? remoteImage;
}
