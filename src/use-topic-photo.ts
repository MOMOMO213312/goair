import { useEffect, useState } from "react";

import { getWikiTopicPhoto } from "@/lib/wiki-image";

/**
 * Resolves an illustrative real photo for a general topic (not a specific
 * place) — e.g. "Flight information display system", "Airport arrivals
 * hall". Returns null while loading or if nothing was found, in which case
 * the caller should fall back to a placeholder.
 */
export function useTopicPhoto(topic: string): string | null {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!topic) {
      setImage(null);
      return;
    }

    let cancelled = false;
    getWikiTopicPhoto(topic).then((url) => {
      if (!cancelled) setImage(url);
    });

    return () => {
      cancelled = true;
    };
  }, [topic]);

  return image;
}
