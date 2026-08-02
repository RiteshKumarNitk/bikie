import { Redis } from "@upstash/redis";
import { fetchWithTimeout } from "../../communications/infrastructure/http";
import type { NearbyPlace, PlaceType, PlacesPort } from "../ports";

const EARTH_RADIUS_METERS = 6_371_000;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.asin(Math.sqrt(a));
}

interface PlacesApiResponse {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
  }[];
}

let cache: Redis | null | undefined;
function getCache(): Redis | null {
  if (cache !== undefined) return cache;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cache = url && token ? new Redis({ url, token }) : null;
  return cache;
}

/** Google Places (New) + optional Upstash cache — vendor details stay out of application code. */
export function createPlacesAdapter(): PlacesPort {
  return {
    async findNearby(lat, lng, type: PlaceType, radiusMeters = 5000): Promise<NearbyPlace[]> {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.log(`[Places][DEV] nearby ${type} @ ${lat},${lng}`);
        return [];
      }

      const redisCache = getCache();
      const cacheKey = `places:${type}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
      if (redisCache) {
        const cached = await redisCache.get<NearbyPlace[]>(cacheKey);
        if (cached) return cached;
      }

      const res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 10,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
          },
          rankPreference: "DISTANCE",
        }),
      });

      if (!res.ok) {
        console.error(`[Places] Failed: ${await res.text()}`);
        return [];
      }

      const data: PlacesApiResponse = await res.json();
      const results = (data.places ?? [])
        .filter((p) => p.location)
        .map((p) => ({
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: p.location!.latitude,
          lng: p.location!.longitude,
          distanceMeters: Math.round(
            haversineMeters(lat, lng, p.location!.latitude, p.location!.longitude),
          ),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      if (redisCache) await redisCache.set(cacheKey, results, { ex: 600 });
      return results;
    },
  };
}
