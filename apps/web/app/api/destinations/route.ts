import { NextResponse } from "next/server";
import { DestinationService } from "@bikie/services";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET() {
  const destinations = await DestinationService.getAll();
  return NextResponse.json({ destinations });
}
