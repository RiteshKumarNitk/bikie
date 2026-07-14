import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { createMembershipPlanSchema } from "@bikie/validation";
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

  const parsed = createMembershipPlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await AdminService.createMembershipPlan(parsed.data);
  await logAdminAction({
    userId: session.user.id,
    action: "CREATE_MEMBERSHIP_PLAN",
    entity: "MembershipPlan",
    entityId: plan.id,
  });
  return NextResponse.json({ plan });
}
