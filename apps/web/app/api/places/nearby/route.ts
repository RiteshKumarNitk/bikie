import { NextResponse } from "next/server";
import { PlacesService } from "@bikie/services";
import { nearbyPlacesQuerySchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  // Defense-in-depth against direct hits running up billing, even though this is only ever
  // rendered inside the already membership-gated SOS "Nearby Help" tab.
  const rateLimitError = await enforceRateLimit("places-nearby", session.user.id, {
    requests: 10,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const url = new URL(request.url);
  const parsed = nearbyPlacesQuerySchema.safeParse({
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const places = await PlacesService.findNearby(parsed.data.lat, parsed.data.lng, parsed.data.type);
  return NextResponse.json({ places });
}
