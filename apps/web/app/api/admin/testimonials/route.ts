import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const testimonials = await AdminService.getAllTestimonials();
  return NextResponse.json({ testimonials });
}

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const testimonial = await AdminService.createTestimonial({
    authorName: body.authorName,
    authorLocation: body.authorLocation,
    authorAvatarUrl: body.authorAvatarUrl,
    rating: body.rating,
    quote: body.quote,
  });
  return NextResponse.json({ testimonial });
}