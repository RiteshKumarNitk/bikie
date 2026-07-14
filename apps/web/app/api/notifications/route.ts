import { NextResponse } from "next/server";
import { NotificationService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const notifications = await NotificationService.listForUser(session.user.id);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id, action } = await request.json();
  if (action === "MARK_ALL_READ") {
    await NotificationService.markAllRead(session.user.id);
  } else if (id) {
    await NotificationService.markRead(session.user.id, id);
  }

  return NextResponse.json({ ok: true });
}
