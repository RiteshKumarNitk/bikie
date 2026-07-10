import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const locked = body.locked !== false;
  const reason = typeof body.reason === "string" ? body.reason : "No reason given";

  await ModerationService.setConversationLocked(id, session.user.id, locked, reason);
  await logAdminAction({
    userId: session.user.id,
    action: locked ? "LOCK_CONVERSATION" : "UNLOCK_CONVERSATION",
    entity: "Conversation",
    entityId: id,
    metadata: { reason },
  });

  return NextResponse.json({ success: true });
}
