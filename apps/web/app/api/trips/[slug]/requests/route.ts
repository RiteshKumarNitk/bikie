import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { joinRequestSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const result = await TripService.getPendingRequests(slug, session.user.id);
  if (!result.ok) {
    const status = result.reason === "TRIP_NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ requests: result.requests });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  // Generous for a rider genuinely browsing and requesting several rides, blocks a bulk-spam
  // loop against every ride on the platform — mirrors the pattern already used for trip-create.
  const rateLimitError = await enforceRateLimit("trip-join-request", session.user.id, {
    requests: 20,
    windowSeconds: 600,
  });
  if (rateLimitError) return rateLimitError;

  const { slug } = await params;
  const body = await req.json();
  const parsed = joinRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await TripService.requestToJoin(slug, session.user.id, parsed.data.message);
  if (!result.ok) {
    const status = result.reason === "TRIP_NOT_FOUND" ? 404 : result.reason === "ALREADY_REQUESTED" ? 409 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
