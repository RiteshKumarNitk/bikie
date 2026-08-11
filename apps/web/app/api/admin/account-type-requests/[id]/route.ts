import { NextResponse } from "next/server";
import { AccountTypeRequestService } from "@bikie/services";
import { reviewAccountTypeRequestSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const detail = await AccountTypeRequestService.getById(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

/** ADR-053 — Approve/Reject/Request-info. APPROVE atomically flips `User.accountType` in the
 * same DB transaction as the request's own status — the only non-registration path that ever
 * writes it. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = reviewAccountTypeRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await AccountTypeRequestService.review(id, parsed.data.decision, {
    adminRemarks: parsed.data.adminRemarks,
    adminUserId: session.user.id,
  });
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { error: "INVALID_TRANSITION", currentStatus: result.currentStatus },
      { status: 409 },
    );
  }

  await logAdminAction({
    userId: session.user.id,
    action: `${parsed.data.decision}_ACCOUNT_TYPE_REQUEST`,
    entity: "AccountTypeChangeRequest",
    entityId: id,
    metadata: parsed.data.adminRemarks ? { adminRemarks: parsed.data.adminRemarks } : undefined,
  });
  return NextResponse.json({ success: true, decision: result.decision });
}
