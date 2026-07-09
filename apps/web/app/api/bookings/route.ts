import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@bikie/services";
import { createBookingSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const bookings = await BookingService.getForUser(session.user.id, status);
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await BookingService.create(session.user.id, parsed.data);
  if (!result.ok) {
    if (result.reason === "BIKE_NOT_FOUND") {
      return NextResponse.json({ error: "Bike not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
