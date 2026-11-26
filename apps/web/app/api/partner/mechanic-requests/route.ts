import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { requirePartnerCapability } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const result = await getMechanicMarketplaceModule().requests.getPartnerInbox(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 403 });
  return NextResponse.json({ requests: result.requests });
}
