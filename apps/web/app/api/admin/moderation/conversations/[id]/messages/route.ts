import { NextResponse } from "next/server";
import { ModerationService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/** §34 of the master product spec — gated, audited admin view of a conversation's message
 * content for trust/safety investigations. Every access is audit-logged (admin ID, conversation
 * ID, reason, timestamp). The `reason` query param is required: an admin must explain why they
 * are reading this conversation. Content is decrypted server-side — the admin's own session has
 * no access to the message encryption key. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const reason = new URL(request.url).searchParams.get("reason");
  if (!reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to view conversation messages." }, { status: 400 });
  }

  const messages = await ModerationService.getMessagesForModeration(id, session.user.id, reason.trim());
  return NextResponse.json({ messages });
}