import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/** ADR-090 — Admin → Legal overview: every document with its current version, open draft and
 * acceptance count for the current version. */
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const documents = await LegalService.getOverview();
  return NextResponse.json({ documents });
}
