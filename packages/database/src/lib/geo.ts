const EARTH_RADIUS_METERS = 6_371_000;

/** Plain in-app Haversine — used wherever a table is small enough that fetching everything and
 * filtering/sorting in JS is simpler than a PostGIS column (partners, SOS alerts). The
 * high-write `rider_location` table is the one exception that justifies real PostGIS
 * (`ST_DWithin`) — see rider-location.repository.ts. */
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
