import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updateUserRoleSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updateUserRoleSchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await AdminService.updateUserRole(id, parsed.data.role);
  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_USER_ROLE",
    entity: "User",
    entityId: id,
    metadata: { newRole: parsed.data.role },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const result = await AdminService.deleteUser(id);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "This user has existing bookings, reviews, organized rides, or moderation history and can't be deleted. Consider suspending the account instead.",
      },
      { status: 409 },
    );
  }
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_USER",
    entity: "User",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}