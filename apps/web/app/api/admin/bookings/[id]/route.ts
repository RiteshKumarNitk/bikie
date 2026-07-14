import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updateBookingStatusSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updateBookingStatusSchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await AdminService.updateBookingStatus(id, parsed.data.status);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_BOOKING_STATUS",
    entity: "Booking",
    entityId: id,
    metadata: { newStatus: parsed.data.status },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteBooking(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_BOOKING",
    entity: "Booking",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}