import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** ADR-090 — does the signed-in user need to accept a newer legal version? Compares each current
 * published version with what this user actually accepted; acceptance is never inferred. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const status = await LegalService.getConsentStatus(session.user.id);
  return NextResponse.json(status);
}
