import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";

export const revalidate = 300;

export async function GET() {
  const plans = await MembershipService.getPlans();
  return NextResponse.json({ plans });
}