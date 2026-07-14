import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const group = await AdminService.updateGroup(id, {
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    type: body.type,
    city: body.city === "" ? null : body.city,
    isPrivate: body.isPrivate !== undefined ? Boolean(body.isPrivate) : undefined,
    ownerId: body.ownerId,
  });
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_GROUP",
    entity: "Group",
    entityId: id,
  });
  return NextResponse.json({ group });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteGroup(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_GROUP",
    entity: "Group",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
