import { NextRequest, NextResponse } from "next/server";
import { featuredBikesQuerySchema } from "@bikie/validation";
import { BikeService } from "@bikie/services";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = featuredBikesQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const bikes = await BikeService.getFeatured(parsed.data.limit);
  return NextResponse.json({ bikes });
}
