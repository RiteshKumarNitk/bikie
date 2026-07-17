import { NextResponse } from "next/server";
import { RiderLocationService } from "@bikie/services";
import { riderLocationUpdateSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function PUT(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  // Client pushes a fix roughly every 45s while sharing is on — headroom for retries/multi-tab
  // without allowing abuse.
  const rateLimitError = await enforceRateLimit("rider-location-update", session.user.id, {
    requests: 30,
    windowSeconds: 300,
  });
  if (rateLimitError) return rateLimitError;

  const parsed = riderLocationUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await RiderLocationService.updateLocation(
    session.user.id,
    parsed.data.latitude,
    parsed.data.longitude,
  );
  if (!updated) {
    return NextResponse.json(
      { error: "SHARING_DISABLED", message: "Location sharing isn't enabled." },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
