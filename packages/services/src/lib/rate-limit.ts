import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Same Upstash Redis REST credentials/posture as RealtimeService (./realtime.ts) and the
// Better Auth secondaryStorage wiring in packages/auth/src/server.ts.
// Without Upstash we fall back to a per-instance in-memory window instead of denying: these
// buckets guard abuse on paths that include SOS alert creation, and a limiter outage must
// never block an emergency alert (ADR-029 supersedes the fail-closed rule from ADR-027).
let client: Redis | null | undefined;
let loggedFallback = false;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!loggedFallback) {
      const level = process.env.NODE_ENV === "production" ? console.warn : console.log;
      level(
        "[RateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — using per-instance in-memory limits.",
      );
      loggedFallback = true;
    }
    client = null;
    return client;
  }
  client = new Redis({ url, token });
  return client;
}

type MemoryWindow = { count: number; resetAt: number };
const memoryWindows = new Map<string, MemoryWindow>();

/**
 * Fixed-window fallback. Per-instance only, so it under-counts across replicas — acceptable
 * because it is a degraded mode, and over-counting would reject legitimate emergency traffic.
 */
function checkInMemory(
  bucket: string,
  requests: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryWindows.get(bucket);

  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(bucket, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (memoryWindows.size > 10_000) {
      for (const [key, win] of memoryWindows) {
        if (win.resetAt <= now) memoryWindows.delete(key);
      }
    }
    return { success: true, retryAfterSeconds: 0, degraded: true };
  }

  existing.count += 1;
  if (existing.count > requests) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      degraded: true,
    };
  }
  return { success: true, retryAfterSeconds: 0, degraded: true };
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
  /** True when the decision came from the per-instance fallback rather than Redis. */
  degraded?: boolean;
}

/**
 * Generic sliding-window rate limit check, keyed by `${name}:${identifier}`. Used for API
 * routes not covered by Better Auth's own built-in limiter (sign-in/sign-up/etc. — see
 * packages/auth/src/server.ts), e.g. SOS alert creation and message sending.
 */
export const RateLimitService = {
  async check(name: string, identifier: string, requests: number, windowSeconds: number): Promise<RateLimitResult> {
    const bucket = `${name}:${identifier}:${requests}:${windowSeconds}`;
    const limiter = getLimiter(name, requests, windowSeconds);
    if (!limiter) return checkInMemory(bucket, requests, windowSeconds);

    try {
      const result = await limiter.limit(identifier);
      const retryAfterSeconds = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return { success: result.success, retryAfterSeconds };
    } catch (error) {
      // Redis unreachable mid-request: degrade instead of rejecting.
      console.warn(
        `[RateLimit] Redis check failed for bucket "${name}" — falling back to in-memory limits:`,
        error instanceof Error ? error.message : String(error),
      );
      return checkInMemory(bucket, requests, windowSeconds);
    }
  },
};
