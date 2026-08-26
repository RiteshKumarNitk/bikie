import { NextRequest, NextResponse } from "next/server";
import { createTripSchema, tripsQuerySchema } from "@bikie/validation";
import { TripService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = tripsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tab, destination, difficulty, from, to } = parsed.data;
  const trips = await TripService.getByTab(tab, { destination, difficulty, from, to });
  return NextResponse.json({ trips });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireMembership();
  if (error) return error;

  // Generous for a genuine organizer planning several rides, blocks a spam/flood loop —
  // mirrors the pattern already used for message-send and SOS-alert-create.
  const rateLimitError = await enforceRateLimit("trip-create", session.user.id, { requests: 10, windowSeconds: 3600 });
  if (rateLimitError) return rateLimitError;

  const body = await req.json();
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const trip = await TripService.create(session.user.id, parsed.data);
  return NextResponse.json({ trip }, { status: 201 });
}
