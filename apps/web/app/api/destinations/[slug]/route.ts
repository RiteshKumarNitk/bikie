import { NextResponse } from "next/server";
import { DestinationService } from "@bikie/services";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = await DestinationService.getBySlug(slug);
  if (!destination) {
    return NextResponse.json({ error: "Destination not found" }, { status: 404 });
  }
  return NextResponse.json({ destination });
}
