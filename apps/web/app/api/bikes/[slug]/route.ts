import { NextResponse } from "next/server";
import { BikeService } from "@bikie/services";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bike = await BikeService.getBySlug(slug);
  if (!bike) {
    return NextResponse.json({ error: "Bike not found" }, { status: 404 });
  }
  return NextResponse.json({ bike });
}
