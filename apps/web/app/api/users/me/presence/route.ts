import { NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  await UserService.touchLastActiveAt(session.user.id);
  return NextResponse.json({ ok: true });
}
