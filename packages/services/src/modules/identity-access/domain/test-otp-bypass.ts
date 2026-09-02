import { toE164Phone } from "../../communications/domain/phone";

/**
 * Dedicated OTP bypass for a small allowlist of named phone numbers
 * (`TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE`, each optionally comma-separated for
 * multiple numbers) paired with a single fixed `TEST_OTP` code. Independent of
 * `SHOW_OTP_TOAST`/`DevOtpStore` (that mechanism generates a random code per session for manual
 * QA; this one is a fixed, predictable credential for specific named personas).
 *
 * ADR-072 — this now works in production **only when both `TEST_OTP` and at least one test phone
 * are explicitly configured**. Google Play / App Store review verifies the app against the
 * production backend and cannot use a real number to receive an SMS, so a dedicated non-
 * privileged test account reached by a fixed code is the only viable demo credential. A
 * production deploy that leaves these vars blank is completely unaffected — no bypass exists.
 * The blast radius is exactly the allowlisted test accounts (plain Rider / Service Provider, no
 * admin, no real user data); the fixed code alone is useless without one of the exact numbers.
 */
function parseTestPhones(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean)
    .map(toE164Phone);
}

function configuredTestPhones(): string[] {
  return [
    ...parseTestPhones(process.env.TEST_RIDER_PHONE),
    ...parseTestPhones(process.env.TEST_SERVICE_PROVIDER_PHONE),
  ];
}

function configuredTestOtp(): string | null {
  const value = process.env.TEST_OTP?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Outside production: always available (dev/QA convenience). In production: available only when
 * the operator has deliberately set `TEST_OTP` plus at least one test phone (ADR-072).
 */
export function isTestOtpBypassEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return configuredTestOtp() !== null && configuredTestPhones().length > 0;
}

export function isTestBypassPhoneNumber(phoneNumber: string): boolean {
  if (!isTestOtpBypassEnabled()) return false;
  const testPhones = configuredTestPhones();
  if (testPhones.length === 0) return false;
  return testPhones.includes(toE164Phone(phoneNumber));
}

export function matchesTestOtpCode(code: string): boolean {
  if (!isTestOtpBypassEnabled()) return false;
  return configuredTestOtp() === code;
}
