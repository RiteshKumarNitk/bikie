import { NextResponse } from "next/server";
import { refreshCachedUserSessions } from "@bikie/auth";
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
  // ADR-055 — `role` and `accountType` are both mirrored onto the Better Auth session, and both
  // writes above go through Prisma. Without this the target user keeps routing by their old
  // role/accountType until their session expires, which makes an admin correction look like it
  // silently did nothing.
  if (user) await refreshCachedUserSessions(id);
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const result = await AdminService.deleteUser(id);
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Admin accounts cannot be deleted." }, { status: 400 });
  }
  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_USER",
    entity: "User",
    entityId: id,
    metadata: { anonymized: result.anonymized },
  });
  return NextResponse.json({ success: true, anonymized: result.anonymized });
}