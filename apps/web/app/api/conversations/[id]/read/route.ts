import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { readReceiptSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const parsed = readReceiptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await MessageService.markRead(id, session.user.id, parsed.data.upToMessageId);
  return NextResponse.json({ success: true });
}
