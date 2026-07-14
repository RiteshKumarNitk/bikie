import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const trip = await AdminService.updateTrip(id, {
    title: body.title,
    description: body.description,
    seatsTotal: body.seatsTotal !== undefined ? Number(body.seatsTotal) : undefined,
    startDate: body.startDate,
    endDate: body.endDate,
    status: body.status,
  });
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_TRIP",
    entity: "Trip",
    entityId: id,
    metadata: { status: body.status },
  });
  return NextResponse.json({ trip });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteTrip(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_TRIP",
    entity: "Trip",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
