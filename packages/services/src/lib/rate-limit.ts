import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Same Upstash Redis REST credentials/posture as RealtimeService (./realtime.ts) and the
// Better Auth secondaryStorage wiring in packages/auth/src/server.ts: if unset (e.g. local
// dev without Upstash configured), rate limiting is a no-op rather than a hard failure.
let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log("[RateLimit][DEV] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is a no-op.");
    client = null;
    return client;
  }
  client = new Redis({ url, token });
  return client;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, windowSeconds: number): Ratelimit | null {
  const redis = getClient();
  if (!redis) return null;
  const cacheKey = `${name}:${requests}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      prefix: `bikie-ratelimit:${name}`,
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  /** Seconds the caller should wait before retrying. 0 when `success` is true. */
  retryAfterSeconds: number;
}

/**
 * Generic sliding-window rate limit check, keyed by `${name}:${identifier}`. Used for API
 * routes not covered by Better Auth's own built-in limiter (sign-in/sign-up/etc. — see
 * packages/auth/src/server.ts), e.g. SOS alert creation and message sending.
 */
export const RateLimitService = {
  async check(name: string, identifier: string, requests: number, windowSeconds: number): Promise<RateLimitResult> {
    const limiter = getLimiter(name, requests, windowSeconds);
    if (!limiter) return { success: true, retryAfterSeconds: 0 };

    const result = await limiter.limit(identifier);
    const retryAfterSeconds = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { success: result.success, retryAfterSeconds };
  },
};
