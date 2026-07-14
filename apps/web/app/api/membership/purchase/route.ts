import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { purchaseMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = purchaseMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const membership = await MembershipService.purchaseMembership(
    session.user.id,
    parsed.data.planId,
    parsed.data.paymentId,
  );
  return NextResponse.json({ membership });
}