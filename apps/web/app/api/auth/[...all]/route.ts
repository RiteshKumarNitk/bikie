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
 * Phone-OTP send/verify get a rate-limit + logging gate in front of Better Auth's own handler.
 * Better Auth's `/phone-number/send-otp` endpoint always returns 200 once the request body is
 * valid, regardless of what the `sendOTP` callback does (see
 * better-auth/dist/plugins/phone-number/routes.mjs — it awaits the callback but there's no
 * built-in way for that callback to turn into a 429/400 response), so rejecting abusive
 * requests has to happen here, before Better Auth's handler runs at all. Phone-number format
 * validation itself stays in Better Auth's own `phoneNumberValidator` option
 * (packages/auth/src/server.ts) since that already produces a correctly-shaped client error.
 */
export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const isSend = pathname === SEND_OTP_PATH;
  const isVerify = pathname === VERIFY_OTP_PATH;

  if (!isSend && !isVerify) return handlers.POST(request);

  const phoneNumber = await readPhoneNumber(request);
  const ip = clientIp(request);

  if (isSend && phoneNumber) {
    // Resend cooldown also doubles as "no duplicate OTP while one is still active" — a fresh
    // send is blocked for the first 60s of the 5-minute OTP validity window either way.
    const cooldown = await enforceRateLimit("otp-send-cooldown", phoneNumber, {
      requests: 1,
      windowSeconds: 60,
    });
    if (cooldown) {
      console.log(`[OTP][SEND][REJECTED] reason=cooldown phone=${phoneNumber} ip=${ip}`);
      return cooldown;
    }

    const perPhone = await enforceRateLimit("otp-send-phone", phoneNumber, {
      requests: 3,
      windowSeconds: 600,
    });
    if (perPhone) {
      console.log(`[OTP][SEND][REJECTED] reason=phone-window phone=${phoneNumber} ip=${ip}`);
      return perPhone;
    }

    const perIp = await enforceRateLimit("otp-send-ip", ip, { requests: 10, windowSeconds: 600 });
    if (perIp) {
      console.log(`[OTP][SEND][REJECTED] reason=ip-window phone=${phoneNumber} ip=${ip}`);
      return perIp;
    }
  }

  if (isVerify) {
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
  }

  const response = await handlers.POST(request);
  // Never log `code`/`otp` from the request body here — only phone number, IP, and the
  // resulting HTTP status. Actual SMS delivery success/failure is logged separately by the
  // MSG91 adapter (packages/services/.../sms.adapter.ts).
  console.log(
    `[OTP][${isSend ? "SEND" : "VERIFY"}] phone=${phoneNumber ?? "unknown"} ip=${ip} status=${response.status}`,
  );
  return response;
}
