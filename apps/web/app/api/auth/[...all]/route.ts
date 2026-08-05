import { NextResponse } from "next/server";
import { auth } from "@bikie/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { enforceRateLimit } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

const SEND_OTP_PATH = "/api/auth/phone-number/send-otp";
const VERIFY_OTP_PATH = "/api/auth/phone-number/verify";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
}

async function readPhoneNumber(request: Request): Promise<string | null> {
  try {
    const body = await request.clone().json();
    return typeof body?.phoneNumber === "string" ? body.phoneNumber : null;
  } catch {
    return null;
  }
}

/**
 * Phone-OTP verify gets a rate-limit + logging gate in front of Better Auth's own handler.
 * `/phone-number/send-otp` is disabled entirely (ADR-034) — MSG91 owns OTP delivery on both
 * platforms now (its Widget SDK on web, native API via /api/otp/mobile/send on mobile), so
 * Better Auth's own send-otp endpoint would otherwise be a live, unused-but-reachable second OTP
 * system. Blocking it here, ahead of any rate-limit check, is belt-and-suspenders alongside the
 * `sendOTP` trip-wire in packages/auth/src/server.ts. Verify-side rate limiting stays: Better
 * Auth's `/phone-number/verify` endpoint always returns 200 once the request body is valid
 * regardless of what its `verifyOTP` hook decides (see
 * better-auth/dist/plugins/phone-number/routes.mjs), so rejecting abusive requests has to happen
 * here, before Better Auth's handler runs at all.
 */
export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (pathname === SEND_OTP_PATH) {
    return NextResponse.json({ error: "This endpoint has moved" }, { status: 410 });
  }

  if (pathname !== VERIFY_OTP_PATH) return handlers.POST(request);

  const phoneNumber = await readPhoneNumber(request);
  const ip = clientIp(request);

  const perIp = await enforceRateLimit("otp-verify-ip", ip, { requests: 20, windowSeconds: 600 });
  if (perIp) {
    console.log(`[OTP][VERIFY][REJECTED] reason=ip-window ip=${ip}`);
    return perIp;
  }
  if (phoneNumber) {
    const perPhone = await enforceRateLimit("otp-verify-phone", phoneNumber, {
      requests: 10,
      windowSeconds: 600,
    });
    if (perPhone) {
      console.log(`[OTP][VERIFY][REJECTED] reason=phone-window phone=${phoneNumber} ip=${ip}`);
      return perPhone;
    }
  }

  const response = await handlers.POST(request);
  // Never log `code`/`otp` from the request body here — only phone number, IP, and the
  // resulting HTTP status.
  console.log(`[OTP][VERIFY] phone=${phoneNumber ?? "unknown"} ip=${ip} status=${response.status}`);
  return response;
}
