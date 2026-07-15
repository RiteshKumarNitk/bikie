import { Redis } from "@upstash/redis";

/**
 * Local-dev-only convenience so the OTP shown by SMSService's console-log fallback can also
 * be surfaced in the browser instead of requiring a terminal check. Never touches real SMS
 * delivery, and is a hard no-op in production regardless of which storage path is used below.
 *
 * Backed by the same Upstash Redis instance as RateLimitService/RealtimeService/Better Auth's
 * secondaryStorage when configured — required, not optional, despite this being dev-only:
 * Next.js API routes are not guaranteed to share in-process module state with each other (each
 * route handler can be compiled into its own isolated bundle), so a plain in-memory `Map` here
 * silently never sees what `packages/auth/src/server.ts`'s `sendOTP` callback wrote, even
 * though both import the same source file. The in-memory Map below is kept only as a
 * best-effort fallback for the (rare) case Upstash isn't configured either.
 */
let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

interface Entry {
  code: string;
  expiresAt: number;
}
const memoryStore = new Map<string, Entry>();
const KEY_PREFIX = "bikie-dev-otp:";

export const DevOtpStore = {
  async set(phoneNumber: string, code: string, ttlSeconds: number) {
    if (process.env.NODE_ENV === "production") return;
    const redis = getRedis();
    if (redis) {
      await redis.set(`${KEY_PREFIX}${phoneNumber}`, code, { ex: ttlSeconds });
      return;
    }
    memoryStore.set(phoneNumber, { code, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async get(phoneNumber: string): Promise<string | null> {
    if (process.env.NODE_ENV === "production") return null;
    const redis = getRedis();
    if (redis) {
      return (await redis.get<string>(`${KEY_PREFIX}${phoneNumber}`)) ?? null;
    }
    const entry = memoryStore.get(phoneNumber);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(phoneNumber);
      return null;
    }
    return entry.code;
  },
};
