import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { editMessageSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { messageId } = await params;
  const parsed = editMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await MessageService.editMessage(messageId, session.user.id, parsed.data.content);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ message: result.message });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { messageId } = await params;
  const result = await MessageService.deleteOwnMessage(messageId, session.user.id);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ message: result.message });
}
