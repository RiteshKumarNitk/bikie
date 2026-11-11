import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { transitionMechanicRequestSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Full detail including precise location — but only for the request's own Rider or the listing's
 * owning Partner; `getRequestDetail` returns `null` (→ 404) for anyone else, same as "not found"
 * rather than confirming the id exists to an unauthorized caller. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const requestDetail = await getMechanicMarketplaceModule().requests.getRequestDetail(id, session.user.id);
  if (!requestDetail) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ request: requestDetail });
}

const REASON_STATUS: Record<string, number> = { NOT_FOUND: 404, FORBIDDEN: 403, INVALID_TRANSITION: 409 };

/** Shared by both sides — the Partner accepts/rejects/progresses/completes, the Rider cancels.
 * `transition()` itself derives which role the caller actually is and whether this specific
 * status is theirs to set; this route never assumes one or the other. Every transition is an
 * atomic `WHERE status = <expected>` update (see mechanic-request.repository.ts), so two
 * concurrent PATCHes for the same request can't both succeed. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const parsed = transitionMechanicRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getMechanicMarketplaceModule().requests.transition(session.user.id, id, parsed.data.status);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ request: result.request });
}
