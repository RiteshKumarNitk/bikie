import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requirePartnerCapability } from "@/lib/require-role";

/** ADR-046b — the partner's "Completed Assistance"/"Assistance History" list: this partner's
 * finished (COMPLETED/CANCELLED) sessions as helper, newest first. */
export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const sessions = await SOSSessionService.listHistory(session.user.id);
  return NextResponse.json({ sessions });
}
