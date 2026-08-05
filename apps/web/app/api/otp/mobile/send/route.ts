import { NextResponse } from "next/server";
import { getIdentityAccessModule, isValidIndianMobile } from "@bikie/services";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Mobile-only OTP send (ADR-034). Flutter has no equivalent to MSG91's browser-only Widget SDK
 * (used by web instead), so this calls MSG91's native server-to-server OTP API directly.
 * Deliberately bypasses Better Auth entirely — Better Auth never generates a code, only verifies
 * one via `POST /api/auth/phone-number/verify`, which both platforms still share unchanged.
 *
 * Rate limiting here is the same shape Better Auth's own send-otp endpoint used to have before
 * ADR-034 (see apps/web/app/api/auth/[...all]/route.ts's history) — moved here since that
 * endpoint is now disabled. `isValidIndianMobile` is re-checked here too: Better Auth's
 * `phoneNumberValidator` option only guards its own endpoints, not this one.
 */
function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  let phoneNumber: string | null = null;
  try {
    const body = await request.json();
    phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber : null;
  } catch {
    // fall through to the missing-phoneNumber 400 below
  }

  if (!phoneNumber || !isValidIndianMobile(phoneNumber)) {
    return NextResponse.json({ error: "A valid Indian mobile number is required" }, { status: 400 });
  }

  const cooldown = await enforceRateLimit("otp-send-cooldown", phoneNumber, { requests: 1, windowSeconds: 60 });
  if (cooldown) {
    console.log(`[OTP][MOBILE-SEND][REJECTED] reason=cooldown phone=${phoneNumber} ip=${ip}`);
    return cooldown;
  }

  const perPhone = await enforceRateLimit("otp-send-phone", phoneNumber, { requests: 3, windowSeconds: 600 });
  if (perPhone) {
    console.log(`[OTP][MOBILE-SEND][REJECTED] reason=phone-window phone=${phoneNumber} ip=${ip}`);
    return perPhone;
  }

  const perIp = await enforceRateLimit("otp-send-ip", ip, { requests: 10, windowSeconds: 600 });
  if (perIp) {
    console.log(`[OTP][MOBILE-SEND][REJECTED] reason=ip-window phone=${phoneNumber} ip=${ip}`);
    return perIp;
  }

  const result = await getIdentityAccessModule().otp.sendNativeLoginOtp({ phoneNumber });
  // Never log `code`/`otp` — only phone number, IP, and outcome.
  console.log(`[OTP][MOBILE-SEND] phone=${phoneNumber} ip=${ip} ok=${result.ok}`);

  if (!result.ok) {
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
