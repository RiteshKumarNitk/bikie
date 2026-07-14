import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { sendMessageSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const result = await MessageService.getMessages(id, session.user.id, session.user.role === "ADMIN");
  if (result === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.viewedAsAdmin) {
    await logAdminAction({
      userId: session.user.id,
      action: "VIEW_CONVERSATION",
      entity: "Conversation",
      entityId: id,
    });
  }
  return NextResponse.json({ messages: result.messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  // Generous enough for a real back-and-forth conversation while blocking a spam/flood loop.
  const rateLimitError = await enforceRateLimit("message-send", session.user.id, {
    requests: 30,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const parsed = sendMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await MessageService.sendMessage(id, session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ message: result.message });
}
