/**
 * Map URL helpers for SOS location sharing — mirrors WhatsApp-style "share location":
 * - pin: open the exact GPS pin
 * - navigate: open Google Maps directions TO that pin so the recipient's phone
 *   calculates distance/ETA from their current location
 */

export function mapsPinUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/** Directions deep-link — on mobile this asks for the user's location and shows distance. */
export function mapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function formatDistance(meters?: number): string | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}
