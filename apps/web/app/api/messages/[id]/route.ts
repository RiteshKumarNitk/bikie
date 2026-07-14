import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const { content } = await request.json();
  if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  const result = await MessageService.editMessage(id, session.user.id, content);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ message: result.message });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const result = await MessageService.deleteOwnMessage(id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ message: result.message });
}
