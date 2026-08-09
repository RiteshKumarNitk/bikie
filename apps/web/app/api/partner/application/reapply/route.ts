import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** ADR-046b — REJECTED -> DRAFT, clearing the rejection reason but keeping every
 * previously-entered field editable as a starting point. */
export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  const result = await PartnerService.reapply(session.user.id);
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ error: "INVALID_TRANSITION" }, { status: 409 });
  }
  return NextResponse.json({ profile: result.profile });
}
