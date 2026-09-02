/**
 * ADR-072 — a tiny client-visible allowlist of dedicated test phone numbers (Rider / Service
 * Provider) that skip the MSG91 widget entirely: the login page goes straight to the code step
 * and posts the typed code to the backend, which accepts it only if it equals the server-side
 * `TEST_OTP` (see `packages/services/.../test-otp-bypass.ts`). This exists so Google Play / App
 * Store review can sign in without receiving a real SMS.
 *
 * The *numbers* are public by design (they unlock only non-privileged demo accounts with no real
 * data); the fixed code stays server-side. `NEXT_PUBLIC_TEST_RIDER_PHONE` /
 * `NEXT_PUBLIC_TEST_SERVICE_PROVIDER_PHONE` — comma-separated E.164 (`+9198…`) allowed, and left
 * blank in normal deployments, in which case this is a no-op and every login uses real MSG91.
 */
/** Canonicalise to `composePhoneNumber`'s output shape (`+91` + 10 digits) so the env value
 * matches whether it was written as `9876543210`, `+919876543210`, `91 98765 43210`, etc. */
function toCanonical(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return local.length === 10 ? `+91${local}` : null;
}

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((n) => toCanonical(n.trim()))
    .filter((n): n is string => n !== null);
}

const TEST_PHONES = new Set([
  ...parse(process.env.NEXT_PUBLIC_TEST_RIDER_PHONE),
  ...parse(process.env.NEXT_PUBLIC_TEST_SERVICE_PROVIDER_PHONE),
]);

/** `input` is normally `composePhoneNumber`'s E.164 output, but any format is tolerated. */
export function isTestPhoneNumber(input: string): boolean {
  const canonical = toCanonical(input);
  return canonical !== null && TEST_PHONES.has(canonical);
}
