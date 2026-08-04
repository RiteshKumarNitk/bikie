/**
 * Straight-line distance + assumed average speed estimate — no routing API dependency for v1
 * (client decision, see ADR-033). A future Google Distance Matrix implementation is a drop-in
 * replacement for this function's body; nothing else needs to change since callers only see
 * the signature.
 */
const DEFAULT_AVG_SPEED_KMPH = 25;

export function estimateEtaMinutes(distanceMeters: number, avgSpeedKmph = DEFAULT_AVG_SPEED_KMPH): number {
  const distanceKm = distanceMeters / 1000;
  const hours = distanceKm / avgSpeedKmph;
  return Math.max(1, Math.round(hours * 60));
}

const EARTH_RADIUS_METERS = 6_371_000;

/** Great-circle distance between two points — used to give a helper's "I'm Coming" offer a
 * distance/ETA even though the offer flow doesn't otherwise touch PostGIS. */
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
