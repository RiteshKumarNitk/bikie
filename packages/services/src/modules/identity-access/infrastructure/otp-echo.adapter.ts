import { DevOtpStore } from "../../../lib/dev-otp-store";
import type { OtpEchoStorePort } from "../ports";

/** Wraps DevOtpStore, which already no-ops unless SHOW_OTP_TOAST=true outside production. */
export function createOtpEchoAdapter(): OtpEchoStorePort {
  return {
    remember(phoneNumber, code, ttlSeconds) {
      return DevOtpStore.set(phoneNumber, code, ttlSeconds);
    },
    recall(phoneNumber) {
      return DevOtpStore.get(phoneNumber);
    },
  };
}
