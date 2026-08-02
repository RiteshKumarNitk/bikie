import { NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { updateUserPhoneSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = updateUserPhoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await UserService.updatePhone(session.user.id, parsed.data.phone || null);
  return NextResponse.json({ success: true });
}
