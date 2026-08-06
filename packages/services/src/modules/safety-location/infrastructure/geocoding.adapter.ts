import { Redis } from "@upstash/redis";
import { fetchWithTimeout } from "../../communications/infrastructure/http";
import type { ReverseGeocodedAddress, ReverseGeocodingPort } from "../ports";

// Reverse geocoding is a display-only enhancement on the safety-critical SOS create path — it
// must never make alert creation feel slow or hang. Nominatim is normally fast (<1s), but this
// caps the worst case well under the fan-out dispatch's own latency budget.
const GEOCODING_TIMEOUT_MS = 4000;

interface NominatimResponse {
  display_name?: string;
  address?: {
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    building?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

let cache: Redis | null | undefined;
function getCache(): Redis | null {
  if (cache !== undefined) return cache;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cache = url && token ? new Redis({ url, token }) : null;
  return cache;
}

/**
 * OpenStreetMap Nominatim — free, no API key/billing account (same reasoning as ADR-036's
 * OSM-tile choice for maps: no Google Maps key/billing was actually available). Nominatim's
 * usage policy caps public-instance traffic at ~1 req/sec and requires a real identifying
 * User-Agent; SOS alert volume is far under that, and the cache below cuts repeat lookups near
 * the same spot to near-zero regardless.
 */
export function createGeocodingAdapter(): ReverseGeocodingPort {
  return {
    async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodedAddress | null> {
      const redisCache = getCache();
      // ~11m grid — reverse-geocoded results don't meaningfully change at finer resolution than
      // this, and rounding keeps the cache hit rate high for repeated alerts in one neighborhood.
      const cacheKey = `geocode:${lat.toFixed(4)}:${lng.toFixed(4)}`;
      if (redisCache) {
        const cached = await redisCache.get<ReverseGeocodedAddress>(cacheKey);
        if (cached) return cached;
      }

      try {
        const userAgent = process.env.GEOCODING_USER_AGENT || "BIKIE-SOS/1.0 (safety@bikie.app)";
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetchWithTimeout(url, {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
          timeoutMs: GEOCODING_TIMEOUT_MS,
        });
        if (!res.ok) {
          console.error(`[Geocoding] Nominatim returned ${res.status}`);
          return null;
        }

        const data: NominatimResponse = await res.json();
        const addr = data.address ?? {};
        const placeName = addr.amenity ?? addr.shop ?? addr.tourism ?? addr.leisure ?? addr.building ?? addr.road ?? null;
        const area = addr.suburb ?? addr.neighbourhood ?? addr.city_district ?? null;
        const city = addr.city ?? addr.town ?? addr.village ?? null;
        const formattedAddress = data.display_name || [placeName, area, city].filter(Boolean).join(", ");
        if (!formattedAddress) return null;

        const result: ReverseGeocodedAddress = {
          placeName,
          area,
          city,
          state: addr.state ?? null,
          country: addr.country ?? null,
          formattedAddress,
        };

        // 24h TTL — a physical address at a given coordinate doesn't change; this only bounds
        // the cache's growth, not correctness.
        if (redisCache) await redisCache.set(cacheKey, result, { ex: 86_400 });
        return result;
      } catch (err) {
        console.error("[Geocoding] reverse lookup failed", err);
        return null;
      }
    },
  };
}
