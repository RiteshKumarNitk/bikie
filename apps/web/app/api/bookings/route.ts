import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const bookings = await BookingService.getForUser(session.user.id, status);
  return NextResponse.json({ bookings });
}
