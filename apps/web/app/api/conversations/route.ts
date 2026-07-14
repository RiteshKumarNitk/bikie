import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { createConversationSchema } from "@bikie/validation";
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

  const parsed = createConversationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const conversation = await MessageService.getOrCreateConversation(
    session.user.id,
    parsed.data.otherUserId,
    parsed.data.subject,
  );
  return NextResponse.json({ conversation });
}