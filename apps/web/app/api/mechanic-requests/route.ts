import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { submitMechanicRequestSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

const REASON_STATUS: Record<string, number> = { LISTING_NOT_FOUND: 404, LISTING_INACTIVE: 409 };

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const requests = await getMechanicMarketplaceModule().requests.getRiderHistory(session.user.id);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = submitMechanicRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getMechanicMarketplaceModule().requests.submitRequest(session.user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ request: result.request }, { status: 201 });
}
