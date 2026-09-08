import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { refreshCachedUserSessions } from "@bikie/auth";
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
  // ADR-055 — REJECTED → DRAFT is a User.partnerStatus write; re-publish it into any cached
  // session blob. No-op without Redis secondaryStorage.
  await refreshCachedUserSessions(session.user.id);
  return NextResponse.json({ profile: result.profile });
}
