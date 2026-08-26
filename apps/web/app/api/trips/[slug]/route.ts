import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { updateTripSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";
import { getServerSession } from "@/lib/get-session";

// Public, read-only ride detail with a dynamic `[slug]` segment. Staying public/unauthenticated
// is deliberate (discovery), but the exact meeting point and member roster are not discovery
// information — TripService.getBySlug redacts those to null/absent for any caller who isn't the
// organizer, an approved member, or an admin (see rides-community/domain/visibility.ts). Reads
// the session directly (not requireSession(), which would 401 an anonymous browser) purely to
// know which viewer is asking. No `revalidate`/ISR here on purpose now that the response depends
// on viewer identity — a cached response could otherwise serve one viewer's redacted (or
// privileged) view to a different viewer. PATCH below is a mutation and was never cached anyway.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  const trip = await TripService.getBySlug(slug, {
    userId: session?.user.id ?? null,
    isAdmin: session?.user.role === "ADMIN",
  });
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
