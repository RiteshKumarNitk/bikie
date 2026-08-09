import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** ADR-046b — DRAFT | MORE_INFORMATION_REQUIRED -> PENDING_VERIFICATION. The applicant's profile
 * stops being editable the moment this succeeds (see `PUT /api/partner/profile`'s guard) until
 * an admin acts or the applicant is rejected and re-applies. */
export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  const result = await PartnerService.submitApplication(session.user.id);
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND", message: "Start your application first." }, { status: 404 });
    }
    if (result.reason === "INCOMPLETE") {
      return NextResponse.json(
        { error: "INCOMPLETE", message: "Business name, service type, and city are required before submitting." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "INVALID_TRANSITION", status: result.status }, { status: 409 });
  }
  return NextResponse.json({ profile: result.profile });
}
