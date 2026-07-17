import { NextResponse } from "next/server";
import { PushService } from "@bikie/services";
import { pushTokenSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function PUT(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = pushTokenSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await PushService.registerToken(session.user.id, parsed.data.token);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const parsed = pushTokenSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await PushService.unregisterToken(parsed.data.token);
  return NextResponse.json({ success: true });
}
