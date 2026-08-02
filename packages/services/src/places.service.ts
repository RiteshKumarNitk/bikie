import {
  getSafetyLocationModule,
  type NearbyPlace,
  type PlaceType,
} from "./modules/safety-location/public";

export type { PlaceType, NearbyPlace };

/** Compatibility facade — Google Places + Redis cache live in the places adapter. */
export const PlacesService = {
  /** Dev-safe fallback matching SMSService: no API key configured -> log and return []. */
  async findNearby(
    lat: number,
    lng: number,
    type: PlaceType,
    radiusMeters = 5000,
  ): Promise<NearbyPlace[]> {
    return getSafetyLocationModule().places.findNearby(lat, lng, type, radiusMeters);
  },
};
