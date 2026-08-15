import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await PartnerMembershipService.getPlans();
  return NextResponse.json({ plans });
}
