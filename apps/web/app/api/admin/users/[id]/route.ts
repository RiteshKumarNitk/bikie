import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await _request.json();
  const user = await AdminService.updateUserRole(id, body.role);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_USER_ROLE",
    entity: "User",
    entityId: id,
    metadata: { newRole: body.role },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  await AdminService.deleteUser(id);
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_USER",
    entity: "User",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}