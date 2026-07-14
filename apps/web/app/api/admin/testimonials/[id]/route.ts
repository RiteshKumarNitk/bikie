import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updateTestimonialSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updateTestimonialSchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const testimonial = await AdminService.updateTestimonial(id, parsed.data);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_TESTIMONIAL",
    entity: "Testimonial",
    entityId: id,
  });
  return NextResponse.json({ testimonial });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteTestimonial(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_TESTIMONIAL",
    entity: "Testimonial",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}