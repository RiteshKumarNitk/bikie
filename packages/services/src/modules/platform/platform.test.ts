import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./domain/retry";
import { createInProcessJobQueue } from "./infrastructure/in-process-job-queue";
import { createIdempotencyAdapter } from "./infrastructure/idempotency.adapter";

describe("withRetry", () => {
  it("returns on first success", async () => {
    const op = vi.fn(async () => "ok");
    await expect(withRetry(op, { attempts: 3 })).resolves.toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries with jitter then succeeds", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error("temp"))
      .mockResolvedValueOnce("done");
    const sleep = vi.fn(async () => undefined);
    await expect(
      withRetry(op, { attempts: 3, baseDelayMs: 10, sleep, random: () => 0.5 }),
    ).resolves.toBe("done");
    expect(op).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalled();
  });

  it("throws after exhausting attempts", async () => {
    const op = vi.fn(async () => {
      throw new Error("always");
    });
    await expect(
      withRetry(op, { attempts: 2, sleep: async () => undefined, random: () => 0 }),
    ).rejects.toThrow("always");
    expect(op).toHaveBeenCalledTimes(2);
  });
});

describe("in-process job queue", () => {
  it("runs handlers immediately and deduplicates by key", async () => {
    const queue = createInProcessJobQueue();
    const handler = vi.fn(async () => undefined);

    await queue.enqueue("job", { n: 1 }, handler, { idempotencyKey: "k1" });
    const second = await queue.enqueue("job", { n: 2 }, handler, { idempotencyKey: "k1" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(second.deduplicated).toBe(true);
  });
});

describe("idempotency adapter (memory)", () => {
  it("claims once then recalls remembered values", async () => {
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const idem = createIdempotencyAdapter();
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(await idem.claim(key, 60)).toBe(true);
    expect(await idem.claim(key, 60)).toBe(false);

    await idem.remember(key, { ok: true, n: 7 }, 60);
    await expect(idem.recall<{ ok: boolean; n: number }>(key)).resolves.toEqual({ ok: true, n: 7 });

    if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
  });
});
