import { NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { completePhoneSignupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Called once, right after a brand-new phone-OTP account's first `phoneNumber.verify()` —
 * sets the real name (replacing the phone-number placeholder). See ADR-013 and
 * UserService.completePhoneSignup for why this exists as its own step instead of passing
 * `name` through the OTP verify call itself.
 *
 * ADR-046b: no longer applies a role — every account stays RENTER; Service Provider capability
 * only ever comes from the Partner application/verification flow. `role` is still accepted in
 * the request body (older/in-flight clients may still send it) and silently ignored. */
export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = completePhoneSignupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await UserService.completePhoneSignup(session.user.id, { name: parsed.data.name });
  if (!result.ok) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
