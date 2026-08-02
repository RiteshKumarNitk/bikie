import type { PlaceType, SafetyLocationPorts } from "../ports";

export function createPlacesApplication(ports: SafetyLocationPorts) {
  return {
    findNearby(lat: number, lng: number, type: PlaceType, radiusMeters = 5000) {
      return ports.places.findNearby(lat, lng, type, radiusMeters);
    },
  };
}

export type PlacesApplication = ReturnType<typeof createPlacesApplication>;
