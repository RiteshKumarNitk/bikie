import { NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { completePhoneSignupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Called once, right after a brand-new phone-OTP account's first `phoneNumber.verify()` —
 * sets the real name (replacing the phone-number placeholder) and, only on that same first
 * call, applies the role picked on /welcome. See ADR-013 and UserService.completePhoneSignup
 * for why this exists as its own step instead of passing `name`/`role` through the OTP
 * verify call itself. */
export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = completePhoneSignupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await UserService.completePhoneSignup(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, becamePartner: result.becamePartner });
}
