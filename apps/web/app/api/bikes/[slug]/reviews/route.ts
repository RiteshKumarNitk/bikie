import { NextResponse } from "next/server";
import { BikeService, ReviewService } from "@bikie/services";
import { createReviewSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bike = await BikeService.getBySlug(slug);
  if (!bike) {
    return NextResponse.json({ error: "Bike not found" }, { status: 404 });
  }
  const reviews = await ReviewService.getForBike(bike.id);
  return NextResponse.json({ reviews });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const bike = await BikeService.getBySlug(slug);
  if (!bike) {
    return NextResponse.json({ error: "Bike not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await ReviewService.create(session.user.id, bike.id, parsed.data);
  if (!result.ok) {
    if (result.reason === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (result.reason === "ALREADY_REVIEWED") {
      return NextResponse.json({ error: "Booking already reviewed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Booking is not eligible for a review" }, { status: 403 });
  }

  return NextResponse.json({ review: result.review }, { status: 201 });
}
