import { NextRequest, NextResponse } from "next/server";
import { featuredTestimonialsQuerySchema } from "@bikie/validation";
import { TestimonialService } from "@bikie/services";

// DB-backed — must render at request time, not prerendered at build (see
// apps/web/app/api/categories/route.ts for why).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = featuredTestimonialsQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const testimonials = await TestimonialService.getFeatured(parsed.data.limit);
  return NextResponse.json({ testimonials });
}
