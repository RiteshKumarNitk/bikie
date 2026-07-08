import { NextRequest, NextResponse } from "next/server";
import { popularDestinationsQuerySchema } from "@bikie/validation";
import { DestinationService } from "@bikie/services";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const parsed = popularDestinationsQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const destinations = await DestinationService.getPopular(parsed.data.limit);
  return NextResponse.json({ destinations });
}
