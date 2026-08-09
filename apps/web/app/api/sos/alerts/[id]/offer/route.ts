import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { sosOfferCreateSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

/** Helper taps "I'm Coming." */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const rateLimitError = await enforceRateLimit("sos-offer", session.user.id, { requests: 10, windowSeconds: 300 });
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const parsed = sosOfferCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const location =
    parsed.data.latitude != null && parsed.data.longitude != null
      ? { latitude: parsed.data.latitude, longitude: parsed.data.longitude }
      : undefined;

  // ADR-044/046b — an approved Service Provider's "ACCEPT" reuses this exact endpoint, gated
  // additively: verified, available, category-matched, and not already at capacity. Keyed off
  // the server-verified `partnerStatus` (not `role`, which no longer indicates Partner capability
  // under the dual-capability model — a backfilled ex-PARTNER account is `role: RENTER` now) and
  // applied regardless of the caller's current UI "mode" — a dual-capability account offering
  // help is always held to the stricter partner bar, deliberately not something the client-side
  // mode preference can opt out of. Pure Riders are completely unaffected (no opts passed).
  const result = await SOSSessionService.offerHelp(id, session.user.id, location, parsed.data.message, {
    requireAvailableAndCapacity: session.user.partnerStatus === "APPROVED",
  });
  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "FORBIDDEN" || result.reason === "NOT_VERIFIED"
          ? 403
          : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ offer: result.offer });
}
