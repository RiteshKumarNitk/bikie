import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { partnerProfileSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Service Provider business-profile read (`/partner/settings`). Open to any authenticated
 * `accountType: SERVICE_PROVIDER` account (matching PUT below).
 *
 * ADR-055 — deliberately NOT `requirePartnerCapability`: that gate also demands an active
 * Service Provider membership (ADR-051), which a provider who is still *creating* their business
 * profile cannot have bought yet. Reading your own profile and paying for a membership are
 * separate concerns, and PUT below has always been ungated on membership for the same reason —
 * this GET was the odd one out. ADMIN is allowed through for support/debugging. */
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
 * (`/account-type-request`), never a bare API call. Refuses (409) only while `SUSPENDED` — every
 * other status (DRAFT/PENDING_VERIFICATION/MORE_INFORMATION_REQUIRED/REJECTED/APPROVED) is
 * editable, per ADR-049/050: verification status is a trust badge, never a permission-to-operate
 * (or permission-to-edit) gate. This route previously also refused PENDING_VERIFICATION/APPROVED —
 * a leftover from the pre-ADR-049 admin-approval model that meant any already-approved,
 * *operating* provider could never again fix their address or service radius; see
 * `upsertPartnerProfileIfEditable`'s doc comment in packages/database for the full history. */
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
      {
        error:
          "Your Service Provider account is suspended, so your profile can't be edited right now. Contact support for help.",
        status: result.status,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ profile: result.profile });
}
