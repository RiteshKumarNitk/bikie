import { NextResponse } from "next/server";
import { AccountTypeRequestService } from "@bikie/services";
import { submitAccountTypeRequestSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** ADR-053 — "Account Type Request" (Profile -> Help & Support). The user's own request
 * history — reachable to any signed-in account. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const requests = await AccountTypeRequestService.getMine(session.user.id);
  return NextResponse.json({ requests });
}

/** Submits a new support request. `accountType` is never changed here — only ever by an admin's
 * later decision (`PATCH /api/admin/account-type-requests/[id]`). */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = submitAccountTypeRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const currentType = (session.user as { accountType?: string }).accountType ?? "RIDER";
  const result = await AccountTypeRequestService.submitRequest({
    userId: session.user.id,
    currentType,
    requestedType: parsed.data.requestedType,
    reason: parsed.data.reason,
    supportingInfo: parsed.data.supportingInfo,
  });

  if (!result.ok) {
    const status = result.reason === "ALREADY_OPEN" ? 409 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ request: result.request }, { status: 201 });
}
