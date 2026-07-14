import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { updateTripSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await TripService.getBySlug(slug);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  return NextResponse.json({ trip });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const body = await req.json();
  const parsed = updateTripSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await TripService.update(slug, session.user.id, parsed.data);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ trip: result.trip });
}
