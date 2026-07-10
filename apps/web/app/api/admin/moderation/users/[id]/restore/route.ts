import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "Restored by admin";

  await ModerationService.restoreUser(id, session.user.id, reason);
  await logAdminAction({
    userId: session.user.id,
    action: "RESTORE_USER",
    entity: "User",
    entityId: id,
    metadata: { reason },
  });

  return NextResponse.json({ success: true });
}
