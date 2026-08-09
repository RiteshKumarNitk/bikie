import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** ADR-046b — the one read the "Become a Service Provider" flow polls, for every state from
 * NOT_APPLIED (no `Partner` row yet) through APPROVED/REJECTED/SUSPENDED. Session-only, not
 * membership- or role-gated — this is exactly the surface a Rider with no capability yet needs
 * to reach in order to apply. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const application = await PartnerService.getApplication(session.user.id);
  return NextResponse.json(application);
}
