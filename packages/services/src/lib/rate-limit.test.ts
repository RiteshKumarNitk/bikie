import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RateLimitService } from "./rate-limit";

const REDIS_ENV = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;

describe("RateLimitService without Redis", () => {
  const saved = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of REDIS_ENV) {
      saved.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of REDIS_ENV) {
      const value = saved.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("allows traffic in degraded mode instead of failing closed", async () => {
    const identifier = `user-${Math.random()}`;
    const result = await RateLimitService.check("sos-alert-create", identifier, 5, 300);

    expect(result.success).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("still enforces the bucket limit in memory", async () => {
    const identifier = `user-${Math.random()}`;
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await RateLimitService.check("test-bucket", identifier, 3, 60));
    }

    expect(results.slice(0, 3).every((r) => r.success)).toBe(true);
    expect(results[3].success).toBe(false);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
    expect(results[3].degraded).toBe(true);
  });

  it("keeps separate counters per identifier", async () => {
    const first = await RateLimitService.check("per-user", `a-${Math.random()}`, 1, 60);
    const second = await RateLimitService.check("per-user", `b-${Math.random()}`, 1, 60);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
  });
});
