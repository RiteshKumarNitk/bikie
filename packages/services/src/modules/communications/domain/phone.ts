/** Normalize Indian 10-digit / +91 numbers to E.164 for Twilio / Meta. */
export function toE164Phone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) return toE164Phone(trimmed.slice("whatsapp:".length));
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return digits ? `+${digits}` : trimmed;
}

/**
 * Indian mobile numbers: 10 digits starting 6-9, optionally prefixed with country code 91
 * or a leading +. Rejects landlines (don't start 6-9) and anything the wrong length — used to
 * gate OTP send so MSG91 (and SMS spend) never sees a malformed or non-Indian number.
 */
export function isValidIndianMobile(phone: string): boolean {
  const digits = phone.trim().replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

/**
 * Redacts a phone number for server logs — keeps the leading `+` (if present) and the last 4
 * digits, masks everything in between. Every SMS/WhatsApp log line that used to interpolate a
 * recipient's raw number (adapter accept/reject logs, SOS dispatch error strings) goes through
 * this first, so a production log never carries a full mobile number even though the number
 * itself is still what's actually sent to the provider.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(none)";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  const maskedCount = Math.max(digits.length - 4, 3);
  return `${phone.trim().startsWith("+") ? "+" : ""}${"*".repeat(maskedCount)}${last4}`;
}
