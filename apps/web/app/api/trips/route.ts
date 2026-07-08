import { NextRequest, NextResponse } from "next/server";
import { tripsQuerySchema } from "@bikie/validation";
import { TripService } from "@bikie/services";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const parsed = tripsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const trips = await TripService.getByTab(parsed.data.tab);
  return NextResponse.json({ trips });
}
