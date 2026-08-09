import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { partnerVerificationActionSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const detail = await AdminService.getPartnerDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

/** ADR-046b — Approve/Reject/Request-info/Suspend/Restore, replacing the old bare
 * `{isVerified: boolean}` toggle. Each action is a validated state transition. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = partnerVerificationActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await AdminService.transitionPartnerVerification(id, parsed.data.action, {
    reason: parsed.data.reason,
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
    action: `${parsed.data.action}_PARTNER_APPLICATION`,
    entity: "Partner",
    entityId: id,
    metadata: parsed.data.reason ? { reason: parsed.data.reason } : undefined,
  });
  return NextResponse.json({ success: true, status: result.status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deletePartner(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_PARTNER",
    entity: "Partner",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
