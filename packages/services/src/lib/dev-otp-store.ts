import { Redis } from "@upstash/redis";

/**
 * Stores OTP codes so the browser UI can retrieve and display them as a toast notification.
 * Opt-in only: SHOW_OTP_TOAST must be exactly "true". Always no-ops when NODE_ENV=production.
 *
 * Backed by Upstash Redis when configured; in-memory Map is a best-effort local fallback.
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

function isEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.SHOW_OTP_TOAST === "true";
}

interface Entry {
  code: string;
  expiresAt: number;
}
const memoryStore = new Map<string, Entry>();
const KEY_PREFIX = "bikie-dev-otp:";

export const DevOtpStore = {
  async set(phoneNumber: string, code: string, ttlSeconds: number) {
    if (!isEnabled()) return;
    const redis = getRedis();
    if (redis) {
      await redis.set(`${KEY_PREFIX}${phoneNumber}`, code, { ex: ttlSeconds });
      return;
    }
    memoryStore.set(phoneNumber, { code, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async get(phoneNumber: string): Promise<string | null> {
    if (!isEnabled()) return null;
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
