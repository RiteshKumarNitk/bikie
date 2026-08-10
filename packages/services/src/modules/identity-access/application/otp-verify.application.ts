import { toE164Phone } from "../../communications/domain/phone";
import { isTestBypassPhoneNumber, matchesTestOtpCode } from "../domain/test-otp-bypass";
import type { IdentityAccessPorts } from "../ports";

/** MSG91's native OTP is numeric-only (we configure otp_length=6); the Widget SDK's access
 * token is an opaque, non-numeric MSG91 credential string. Better Auth's own `verify` endpoint
 * body is fixed to `{phoneNumber, code}` with no room for a third "which transport" field, so
 * this shape check is the only available discriminator between the two platforms' codes. */
const NATIVE_OTP_SHAPE = /^\d{4,9}$/;

/**
 * Sole verification authority for both platforms (ADR-034), plugged into Better Auth's
 * `phoneNumber()` plugin as `verifyOTP`. Better Auth still owns everything downstream of a
 * `true` return (find-or-create user, session, bearer token) — this only decides yes/no.
 */
export function createOtpVerifyApplication(ports: IdentityAccessPorts) {
  return {
    async verifyLoginOtp(input: { phoneNumber: string; code: string }): Promise<boolean> {
      if (isTestBypassPhoneNumber(input.phoneNumber)) {
        return matchesTestOtpCode(input.code);
      }

      const devCode = await ports.otpEcho.recall(input.phoneNumber);
      if (devCode !== null) {
        return devCode === input.code;
      }

      if (NATIVE_OTP_SHAPE.test(input.code)) {
        return ports.msg91NativeOtp.verify(input.phoneNumber, input.code);
      }

      const result = await ports.msg91WidgetVerify.verifyAccessToken(input.code);
      if (!result.verified) return false;
      if (result.phoneNumber && toE164Phone(result.phoneNumber) !== toE164Phone(input.phoneNumber)) {
        console.log(
          `[MSG91-WIDGET][VERIFY] phone mismatch: claimed=${input.phoneNumber} verified=${result.phoneNumber}`,
        );
        return false;
      }
      return true;
    },
  };
}

export type OtpVerifyApplication = ReturnType<typeof createOtpVerifyApplication>;
