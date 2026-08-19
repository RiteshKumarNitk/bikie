import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { partnerProfileSchema } from "@bikie/validation";
import { requirePartnerCapability, requireSession } from "@/lib/require-role";

/** Service Provider business-profile read (`/partner/settings`). Open to any authenticated
 * `accountType: SERVICE_PROVIDER` account (matching PUT below). */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.accountType !== "SERVICE_PROVIDER" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "WRONG_ACCOUNT_TYPE", message: "This requires a Service Provider account." },
      { status: 403 },
    );
  }

  const profile = await PartnerService.getProfile(session.user.id);
  return NextResponse.json({ profile });
}

/** ADR-053 — open to any authenticated `accountType: SERVICE_PROVIDER` account (never membership-
 * gated — profile creation and operational membership are separate concerns): this is how a
 * Service Provider *starts* their business profile (first call creates a DRAFT row) and how an
 * existing applicant edits it. A `RIDER`-accountType account can no longer reach this at all —
 * changing account type first requires an admin-approved Account Type Change Request
 * (`/account-type-request`), never a bare API call. Refuses (409) while
 * PENDING_VERIFICATION/APPROVED/SUSPENDED — those need an explicit transition (submit/reapply, or
 * an admin action) first. */
export async function PUT(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.user.accountType !== "SERVICE_PROVIDER") {
    return NextResponse.json(
      { error: "WRONG_ACCOUNT_TYPE", message: "This requires a Service Provider account." },
      { status: 403 },
    );
  }

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
