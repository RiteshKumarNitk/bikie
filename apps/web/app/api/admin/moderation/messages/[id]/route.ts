import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "No reason given";
  const reportId = typeof body.reportId === "string" ? body.reportId : undefined;

  const result = await ModerationService.deleteMessage(id, session.user.id, reason, reportId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }

  await logAdminAction({
    userId: session.user.id,
    action: "DELETE_MESSAGE",
    entity: "Message",
    entityId: id,
    metadata: { reason },
  });

  return NextResponse.json({ success: true });
}
