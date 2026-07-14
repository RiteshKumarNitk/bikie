import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { createTestimonialSchema } from "@bikie/validation";
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

  const parsed = createTestimonialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const testimonial = await AdminService.createTestimonial(parsed.data);
  return NextResponse.json({ testimonial });
}