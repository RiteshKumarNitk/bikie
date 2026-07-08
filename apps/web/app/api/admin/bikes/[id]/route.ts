import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await _request.json();
  const bike = await AdminService.updateBike(id, body);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_BIKE",
    entity: "Bike",
    entityId: id,
    metadata: body,
  });
  return NextResponse.json({ bike });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteBike(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_BIKE",
    entity: "Bike",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}