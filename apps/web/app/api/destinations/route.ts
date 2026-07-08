import { NextResponse } from "next/server";
import { DestinationService } from "@bikie/services";

export const revalidate = 300;

export async function GET() {
  const destinations = await DestinationService.getAll();
  return NextResponse.json({ destinations });
}
