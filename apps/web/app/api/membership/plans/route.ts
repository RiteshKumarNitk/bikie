import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await MembershipService.getPlans();
  return NextResponse.json({ plans });
}