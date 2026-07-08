import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";
import { sendEvent } from "@/lib/sse-manager";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const messages = await MessageService.getMessages(id, session.user.id);
  if (messages === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const message = await MessageService.sendMessage(id, session.user.id, body.content);

  // Notify other conversation participants via SSE
  const conversations = await MessageService.getConversations(session.user.id);
  const conv = conversations.find((c) => c.id === id);
  if (conv) {
    for (const p of conv.participants) {
      if (p.id !== session.user.id) {
        sendEvent(p.id, "new_message", message);
      }
    }
  }

  return NextResponse.json({ message });
}