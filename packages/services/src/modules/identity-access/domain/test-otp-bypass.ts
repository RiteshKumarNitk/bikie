import { toE164Phone } from "../../communications/domain/phone";

/**
 * Dedicated dev/test-only OTP bypass for a small set of named phone numbers
 * (`TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE`, each optionally comma-separated for
 * multiple numbers) paired with a single fixed `TEST_OTP` code. Deliberately independent of
 * `SHOW_OTP_TOAST`/`DevOtpStore` (that mechanism generates a random code per session for
 * manual QA; this one is a fixed, predictable credential for automated/API testing of specific
 * named personas) — but both share the same hard `NODE_ENV !== "production"` gate.
 */
function parseTestPhones(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean)
    .map(toE164Phone);
}

export function isTestOtpBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isTestBypassPhoneNumber(phoneNumber: string): boolean {
  if (!isTestOtpBypassEnabled()) return false;
  const testPhones = [
    ...parseTestPhones(process.env.TEST_RIDER_PHONE),
    ...parseTestPhones(process.env.TEST_SERVICE_PROVIDER_PHONE),
  ];
  if (testPhones.length === 0) return false;
  return testPhones.includes(toE164Phone(phoneNumber));
}

export function matchesTestOtpCode(code: string): boolean {
  if (!isTestOtpBypassEnabled()) return false;
  const testOtp = process.env.TEST_OTP;
  return typeof testOtp === "string" && testOtp.length > 0 && code === testOtp;
}
