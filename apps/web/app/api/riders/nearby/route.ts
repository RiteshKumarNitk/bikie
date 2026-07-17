import { NextResponse } from "next/server";
import { RiderLocationService } from "@bikie/services";
import { nearbyRidersQuerySchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

export async function GET(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const url = new URL(request.url);
  const parsed = nearbyRidersQuerySchema.safeParse({
    radiusKm: url.searchParams.get("radiusKm") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Own sharing must be on to see others' locations — reciprocity, not just a membership gate.
  // (Also a natural side effect of the query itself: findNearby self-joins on the caller's own
  // fix as the search center, so no fix on file means zero results regardless.)
  const ownSharing = await RiderLocationService.getSharing(session.user.id);
  if (!ownSharing) {
    return NextResponse.json(
      { error: "SHARING_DISABLED", message: "Turn on location sharing to see nearby riders." },
      { status: 409 },
    );
  }

  const riders = await RiderLocationService.findNearby(session.user.id, parsed.data.radiusKm);
  return NextResponse.json({ riders });
}
