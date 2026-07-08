import { NextRequest, NextResponse } from "next/server";
import { featuredBikesQuerySchema } from "@bikie/validation";
import { BikeService } from "@bikie/services";

export const revalidate = 300;

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
