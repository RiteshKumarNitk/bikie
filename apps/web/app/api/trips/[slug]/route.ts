import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await TripService.getBySlug(slug);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  return NextResponse.json({ trip });
}
