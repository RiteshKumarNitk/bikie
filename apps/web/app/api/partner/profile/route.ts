import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { partnerProfileSchema } from "@bikie/validation";
import { requirePartnerCapability, requireSession } from "@/lib/require-role";

/** Already-approved partners' business-profile read (`/partner/settings`). Brand-new/pending
 * applicants read their in-progress application via `GET /api/partner/application` instead. */
export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const profile = await PartnerService.getProfile(session.user.id);
  return NextResponse.json({ profile });
}

/** ADR-046b — open to any authenticated user (not just approved partners): this is how a
 * Rider *starts* a Service Provider application (first call creates a DRAFT row) and how an
 * existing applicant edits it. Refuses (409) while PENDING_VERIFICATION/APPROVED/SUSPENDED —
 * those need an explicit transition (submit/reapply, or an admin action) first. */
export async function PUT(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = partnerProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerService.upsertProfileIfEditable(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "NOT_EDITABLE", status: result.status },
      { status: 409 },
    );
  }
  return NextResponse.json({ profile: result.profile });
}
