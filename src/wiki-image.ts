const memoryCache = new Map<string, string | null>();
const STORAGE_PREFIX = "goair:wiki-img:";

function readCache(key: string): string | null | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return undefined;
    const value = raw === "" ? null : raw;
    memoryCache.set(key, value);
    return value;
  } catch {
    // Private-mode / storage disabled — fall through to a live fetch.
    return undefined;
  }
}

function writeCache(key: string, value: string | null) {
  memoryCache.set(key, value);
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, value ?? "");
  } catch {
    // Quota exceeded or storage disabled — memory cache still helps this session.
  }
}

async function fetchThumbnail(title: string, lang: "ar" | "en"): Promise<string | null> {
  try {
    const response = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    const url = data.thumbnail?.source ?? data.originalimage?.source;
    if (!url) return null;

    return url.startsWith("//") ? `https:${url}` : url;
  } catch {
    return null;
  }
}

/**
 * Real photo for a place name, sourced from Wikipedia's free, key-less
 * thumbnail API — Arabic article first, then English as a fallback. Results
 * (including "not found") are cached so the same destination never triggers
 * a repeat network call across the many cards it can appear on.
 */
export async function getWikiPlacePhoto(placeName: string, country: string): Promise<string | null> {
  const name = placeName.trim();
  if (!name) return null;

  const key = `${country}::${name}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const result = (await fetchThumbnail(name, "ar")) ?? (await fetchThumbnail(name, "en"));
  writeCache(key, result);
  return result;
}
