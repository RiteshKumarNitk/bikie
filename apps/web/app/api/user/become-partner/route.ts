import { NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { partnerProfileSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = partnerProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await UserService.becomePartner(session.user.id, session.user.role, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Your account is already a partner or admin account." },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
