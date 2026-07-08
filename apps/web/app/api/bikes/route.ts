import { NextRequest, NextResponse } from "next/server";
import { bikeSearchQuerySchema } from "@bikie/validation";
import { BikeService } from "@bikie/services";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const parsed = bikeSearchQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await BikeService.search(parsed.data);
  return NextResponse.json(result);
}
