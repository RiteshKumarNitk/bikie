import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { updateUserAdminSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const parsed = updateUserAdminSchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { role, accountType } = parsed.data;
  let user = null;
  if (role) {
    user = await AdminService.updateUserRole(id, role);
    await logAdminAction({
      userId: session.user.id,
      action: "UPDATE_USER_ROLE",
      entity: "User",
      entityId: id,
      metadata: { newRole: role },
    });
  }
  if (accountType) {
    user = await AdminService.updateUserAccountType(id, accountType);
    await logAdminAction({
      userId: session.user.id,
      action: "UPDATE_ACCOUNT_TYPE",
      entity: "User",
      entityId: id,
      metadata: { newAccountType: accountType },
    });
  }
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const result = await AdminService.deleteUser(id);
  if (!result.ok) {
    const status = result.reason === "ADMIN_PROTECTED" ? 400 : 409;
    return NextResponse.json(
      {
        error:
          result.reason === "ADMIN_PROTECTED"
            ? "Admin accounts cannot be deleted."
            : "This user has existing bookings, reviews, organized rides, or moderation history and can't be deleted. Consider suspending the account instead.",
      },
      { status },
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