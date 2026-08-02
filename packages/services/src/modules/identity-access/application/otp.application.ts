import type { ChannelResult } from "../../communications/ports";
import { buildOtpMessage } from "../domain/otp-message";
import type { IdentityAccessPorts } from "../ports";

export function createOtpApplication(ports: IdentityAccessPorts) {
  return {
    /**
     * Delivers a login OTP. The dev echo is written before the send so the code is
     * retrievable even when the SMS provider rejects the message.
     */
    async sendLoginOtp(input: {
      phoneNumber: string;
      code: string;
      expiresInSeconds: number;
    }): Promise<ChannelResult> {
      await ports.otpEcho.remember(input.phoneNumber, input.code, input.expiresInSeconds);
      return ports.sms.send(input.phoneNumber, buildOtpMessage(input.code, input.expiresInSeconds));
    },
  };
}

export type OtpApplication = ReturnType<typeof createOtpApplication>;
