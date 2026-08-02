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
