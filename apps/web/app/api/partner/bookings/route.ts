import { NextResponse } from "next/server";
import { BookingService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const bookings = await BookingService.getForPartner(session.user.id);
  return NextResponse.json({ bookings });
}
