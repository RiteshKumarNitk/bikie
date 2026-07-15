import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@bikie/services";
import { enforceRateLimit } from "@/lib/rate-limit";

// Unauthenticated by design — the phone-auth UI needs this before a session exists (it's
// deciding whether to show a "create your account" or a plain "log in" step). Only leaks
// existence of a phone number, no other user data. Rate-limited per phone number since
// there's no session to key on yet, to blunt enumeration attempts.
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
  }

  const rateLimitError = await enforceRateLimit("phone-exists-check", phone, {
    requests: 10,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const result = await UserService.phoneNumberExists(phone);
  return NextResponse.json(result);
}
