import { Redis } from "@upstash/redis";
import type { IdempotencyPort } from "../ports";

const KEY_PREFIX = "bikie-idem:";

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

type MemoryEntry = { expiresAt: number; value?: unknown };
const memory = new Map<string, MemoryEntry>();

function pruneMemory(now: number) {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
}

/** Redis-backed when Upstash is set; otherwise process-local memory (dev / single instance). */
export function createIdempotencyAdapter(): IdempotencyPort {
  return {
    async claim(key, ttlSeconds) {
      const redis = getRedis();
      const fullKey = `${KEY_PREFIX}${key}`;
      if (redis) {
        // SET NX EX — claim only if absent
        const result = await redis.set(fullKey, "1", { nx: true, ex: ttlSeconds });
        return result === "OK";
      }
      const now = Date.now();
      pruneMemory(now);
      if (memory.has(fullKey) && memory.get(fullKey)!.expiresAt > now) return false;
      memory.set(fullKey, { expiresAt: now + ttlSeconds * 1000 });
      return true;
    },

    async remember(key, value, ttlSeconds) {
      const redis = getRedis();
      const fullKey = `${KEY_PREFIX}result:${key}`;
      if (redis) {
        await redis.set(fullKey, JSON.stringify(value), { ex: ttlSeconds });
        return;
      }
      memory.set(fullKey, { expiresAt: Date.now() + ttlSeconds * 1000, value });
    },

    async recall<T>(key: string): Promise<T | null> {
      const redis = getRedis();
      const fullKey = `${KEY_PREFIX}result:${key}`;
      if (redis) {
        const raw = await redis.get<string>(fullKey);
        if (raw == null) return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
      }
      const entry = memory.get(fullKey);
      if (!entry || entry.expiresAt <= Date.now()) {
        memory.delete(fullKey);
        return null;
      }
      return (entry.value as T) ?? null;
    },
  };
}
