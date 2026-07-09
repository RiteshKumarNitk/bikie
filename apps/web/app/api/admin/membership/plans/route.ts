import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const plans = await AdminService.getAllMembershipPlans();
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const plan = await AdminService.createMembershipPlan({
    name: body.name,
    description: body.description,
    price: Number(body.price),
    durationDays: Number(body.durationDays),
    benefits: body.benefits,
    sortOrder: body.sortOrder ? Number(body.sortOrder) : undefined,
  });
  await logAdminAction({
    userId: session.user.id,
    action: "CREATE_MEMBERSHIP_PLAN",
    entity: "MembershipPlan",
    entityId: plan.id,
  });
  return NextResponse.json({ plan });
}
