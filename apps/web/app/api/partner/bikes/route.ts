import { NextResponse } from "next/server";
import { BikeService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const bikes = await BikeService.getByOwner(session.user.id);
  return NextResponse.json({ bikes });
}
