import { NextResponse } from "next/server";
import { refreshCachedUserSessions } from "@bikie/auth";
import { UserService } from "@bikie/services";
import { completePhoneSignupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Called once, right after a brand-new phone-OTP account's first `phoneNumber.verify()` —
 * sets the real name (replacing the phone-number placeholder). See ADR-013 and
 * UserService.completePhoneSignup for why this exists as its own step instead of passing
 * `name` through the OTP verify call itself.
 *
 * ADR-053: applies the account's `accountType` (RIDER/SERVICE_PROVIDER) — the one free choice
 * point at registration; the service layer guards this against ever firing on an established
 * account, so it can never become a self-service switch. `role` is still accepted in the
 * request body (older/in-flight clients may still send it) and silently ignored. */
export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = completePhoneSignupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await UserService.completePhoneSignup(session.user.id, {
    name: parsed.data.name,
    accountType: parsed.data.accountType,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // ADR-055 — the write above went through Prisma, so the just-created session still holds the
  // signup-time `accountType: "RIDER"` / `role: "RENTER"` snapshot. Republish it before the
  // client redirects, or a Service Provider signup lands on `/partner-onboarding` and gets
  // bounced to `/account-type-request` by that page's own accountType guard.
  await refreshCachedUserSessions(session.user.id);
  // AccountType requested but not applied = this is an established account (real name, outside
  // the signup window). Not a hard error for a plain name update, but the client must know its
  // chosen accountType did NOT stick — silently proceeding would strand a would-be partner as a
  // Rider with no explanation.
  if (parsed.data.accountType && !result.accountTypeApplied) {
    return NextResponse.json(
      {
        error:
          "This account is already set up and its account type can't be changed here anymore. Contact support or request an account type change from the app.",
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
