/**
 * Local-dev-only convenience so the OTP shown by SMSService's console-log fallback can also
 * be surfaced in the browser instead of requiring a terminal check. In-memory, single-process
 * — fine for `pnpm dev` (one Node process), meaningless in serverless production (where it's
 * a no-op regardless via the NODE_ENV guard below). Never touches real SMS delivery.
 */
interface Entry {
  code: string;
  expiresAt: number;
}

const store = new Map<string, Entry>();

export const DevOtpStore = {
  set(phoneNumber: string, code: string, ttlSeconds: number) {
    if (process.env.NODE_ENV === "production") return;
    store.set(phoneNumber, { code, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  get(phoneNumber: string): string | null {
    const entry = store.get(phoneNumber);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(phoneNumber);
      return null;
    }
    return entry.code;
  },
};
