import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requirePartnerCapability } from "@/lib/require-role";

/** ADR-044 — the partner's "Active Assistance" list: sessions where this partner is the helper
 * and the session isn't COMPLETED/CANCELLED yet. */
export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const sessions = await SOSSessionService.listActiveAssistance(session.user.id);
  return NextResponse.json({ sessions });
}
