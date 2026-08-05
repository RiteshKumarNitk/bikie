import type { ChannelResult } from "../../communications/ports";
import type { IdentityAccessPorts } from "../ports";

const DEV_OTP_LENGTH = 6;
const DEV_OTP_EXPIRY_SECONDS = 300;

function devBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.SHOW_OTP_TOAST === "true";
}

function randomDevCode(length: number): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Mobile-only OTP send (ADR-034) — MSG91's native API is the sole code generator here, mirroring
 * the widget's role on web. Better Auth never generates a code again on either platform; this
 * application intentionally has no Better Auth dependency.
 */
export function createOtpSendApplication(ports: IdentityAccessPorts) {
  return {
    async sendNativeLoginOtp(input: { phoneNumber: string }): Promise<ChannelResult> {
      if (devBypassEnabled()) {
        const code = randomDevCode(DEV_OTP_LENGTH);
        await ports.otpEcho.remember(input.phoneNumber, code, DEV_OTP_EXPIRY_SECONDS);
        console.log(`[MSG91-OTP][DEV-BYPASS] ${input.phoneNumber} -> ${code}`);
        return { ok: true, provider: "dev-bypass" };
      }

      return ports.msg91NativeOtp.send(input.phoneNumber, {
        otpLength: DEV_OTP_LENGTH,
        expirySeconds: DEV_OTP_EXPIRY_SECONDS,
      });
    },
  };
}

export type OtpSendApplication = ReturnType<typeof createOtpSendApplication>;
