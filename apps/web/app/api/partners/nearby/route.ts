import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { nearbyPartnersQuerySchema } from "@bikie/validation";
import { enforceRateLimit } from "@/lib/rate-limit";

const SEARCH_RADIUS_METERS = 25_000;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
}

/** Public "find a service provider near me" (ADR-036) — backs the roadside-assistance page's
 * partner map. No session required (unlike GET /api/places/nearby, which is membership-gated
 * specifically to guard the paid Google Places API from billing runaway); this only queries our
 * own Partner table, so the only real risk is scraping, guarded with a plain IP rate limit. */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rateLimitError = await enforceRateLimit("partners-nearby", ip, { requests: 20, windowSeconds: 60 });
  if (rateLimitError) return rateLimitError;

  const url = new URL(request.url);
  const parsed = nearbyPartnersQuerySchema.safeParse({
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const partners = await PartnerService.findNearby(parsed.data.lat, parsed.data.lng, SEARCH_RADIUS_METERS, {
    type: parsed.data.type,
  });
  return NextResponse.json({ partners });
}
