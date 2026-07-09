import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const plan = await AdminService.updateMembershipPlan(id, body);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_MEMBERSHIP_PLAN",
    entity: "MembershipPlan",
    entityId: id,
  });
  return NextResponse.json({ plan });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteMembershipPlan(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_MEMBERSHIP_PLAN",
    entity: "MembershipPlan",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
