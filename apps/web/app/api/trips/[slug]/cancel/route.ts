import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { cancelTripSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Organizer (or admin) cancels an UPCOMING ride. Stops it from being discoverable/joinable
 * (see `findTrips`'s default `status: "UPCOMING"` filter), locks the Ride Room's conversation
 * against new messages, posts a system message announcing it, and notifies every approved
 * member and still-pending requester. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const parsed = cancelTripSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await TripService.cancelTrip(slug, session.user.id, session.user.role === "ADMIN", parsed.data.reason);
  if (!result.ok) {
    const status = result.reason === "TRIP_NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
