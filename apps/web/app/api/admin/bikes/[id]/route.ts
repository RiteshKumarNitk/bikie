import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updateBikeSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updateBikeSchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bike = await AdminService.updateBike(id, parsed.data);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_BIKE",
    entity: "Bike",
    entityId: id,
    metadata: parsed.data,
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