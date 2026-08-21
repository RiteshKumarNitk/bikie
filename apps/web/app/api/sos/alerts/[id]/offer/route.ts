import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { sosOfferCreateSchema } from "@bikie/validation";
import { requireSosAccess } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

/** Helper taps "I'm Coming." — `requireSosAccess`, not `requireMembership`: a Service Provider's
 * "ACCEPT" reuses this endpoint and holds a Partner membership, not a Rider one (see comment
 * below on the additive capacity/capability gate this then layers on top). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSosAccess();
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

  // FINAL PRODUCT MODEL — a Service Provider's "ACCEPT" reuses this exact endpoint, gated
  // additively: any partner with a profile that isn't admin-SUSPENDED (capability, ADR-049),
  // available, category-matched, and not already at capacity. Verification is NOT part of this
  // gate — unverified providers operate the platform and can accept assistance requests;
  // verification is a separate trust badge. Keyed off the server-verified `partnerStatus` (not
  // `role`, which no longer indicates Partner capability under the dual-capability model — a
  // backfilled ex-PARTNER account is `role: RENTER` now) and applied regardless of the caller's
  // current UI "mode". Pure Riders are completely unaffected (no opts passed).
  const result = await SOSSessionService.offerHelp(id, session.user.id, location, parsed.data.message, {
    requireAvailableAndCapacity:
      session.user.partnerStatus != null && session.user.partnerStatus !== "SUSPENDED",
  });
  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "FORBIDDEN" || result.reason === "NOT_VERIFIED" || result.reason === "MEMBERSHIP_REQUIRED"
          ? 403
          : 409;
    return NextResponse.json(
      result.reason === "MEMBERSHIP_REQUIRED"
        ? {
            error: result.reason,
            message: "This requires an active Service Provider membership (₹99/month). Activate it to accept requests.",
          }
        : { error: result.reason },
      { status },
    );
  }
  return NextResponse.json({ offer: result.offer });
}
