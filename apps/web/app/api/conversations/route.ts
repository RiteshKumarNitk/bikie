import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const conversations = await MessageService.getConversations(session.user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const conversation = await MessageService.getOrCreateConversation(
    session.user.id,
    body.otherUserId,
    body.subject,
  );
  return NextResponse.json({ conversation });
}