import { NextResponse } from "next/server";
import { MessageService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const { emoji } = await request.json();
  if (!emoji) return NextResponse.json({ error: "Missing emoji" }, { status: 400 });

  const result = await MessageService.reactToMessage(id, session.user.id, emoji);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const url = new URL(request.url);
  const emoji = url.searchParams.get("emoji");
  if (!emoji) return NextResponse.json({ error: "Missing emoji query param" }, { status: 400 });

  const result = await MessageService.removeReaction(id, session.user.id, emoji);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
