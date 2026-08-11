import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updatePartnerMembershipPlanSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updatePartnerMembershipPlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await AdminService.updatePartnerMembershipPlan(id, parsed.data);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_PARTNER_MEMBERSHIP_PLAN",
    entity: "PartnerMembershipPlan",
    entityId: id,
  });
  return NextResponse.json({ plan });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deletePartnerMembershipPlan(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_PARTNER_MEMBERSHIP_PLAN",
    entity: "PartnerMembershipPlan",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
