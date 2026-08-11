import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";

export const revalidate = 300;

export async function GET() {
  const plans = await PartnerMembershipService.getPlans();
  return NextResponse.json({ plans });
}
