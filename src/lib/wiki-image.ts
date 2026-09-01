const memoryCache = new Map<string, string | null>();
const STORAGE_PREFIX = "goair:wiki-img:v2:";

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

async function searchThumbnail(query: string, lang: "ar" | "en"): Promise<string | null> {
  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "1");
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "thumbnail");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };
    const pages = data.query?.pages;
    if (!pages) return null;

    const firstPage = Object.values(pages)[0];
    const thumbUrl = firstPage?.thumbnail?.source;
    if (!thumbUrl) return null;

    return thumbUrl.startsWith("//") ? `https:${thumbUrl}` : thumbUrl;
  } catch {
    return null;
  }
}

/**
 * Real photo for a place name, sourced from Wikipedia's free, key-less
 * search API — the search (rather than an exact-title lookup) is what lets
 * "المهندسين" resolve to the actual article "المهندسين (الجيزة)" instead of
 * the bare, photo-less disambiguation page. Arabic first, then English as a
 * fallback. Results (including "not found") are cached so the same
 * destination never triggers a repeat network call across the many cards it
 * can appear on.
 */
export async function getWikiPlacePhoto(placeName: string, country: string): Promise<string | null> {
  const name = placeName.trim();
  if (!name) return null;

  const key = `${country}::${name}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const query = country ? `${name} ${country}` : name;
  const result =
    (await searchThumbnail(query, "ar")) ??
    (await searchThumbnail(name, "ar")) ??
    (await searchThumbnail(query, "en")) ??
    (await searchThumbnail(name, "en"));

  writeCache(key, result);
  return result;
}
