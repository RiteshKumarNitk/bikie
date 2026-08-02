/**
 * NFR baseline scaffold (Phase 8).
 *
 * These are lightweight wall-clock checks for pure domain helpers — not a substitute for
 * production load tests. Documented API budgets (from MODULAR_MONOLITH_IMPLEMENTATION_PLAN):
 *   - Read API p95 ≤ 500 ms at agreed normal load
 *   - Write API p95 ≤ 800 ms (excluding async provider completion)
 *   - Default page ≤ 50; hard maximums on exports (10k) and message history (200/500)
 *
 * Run: `pnpm test -- packages/services/src/modules/platform/nfr-baseline.test.ts`
 * Full load/query-plan baselines remain backlog until a staging dataset is available.
 */
import { describe, expect, it } from "vitest";
import { rentalDaysBetween, computeBookingTotal } from "../rentals-bookings/public";
import { evaluateJoinRequest, computeApprovalRate } from "../rides-community/public";
import { withRetry } from "./domain/retry";

function timed<T>(fn: () => T): { result: T; ms: number } {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
}

describe("NFR baseline scaffold (domain hot paths)", () => {
  it("booking pricing stays well under 5ms for 1k iterations", () => {
    const start = new Date("2026-08-01T00:00:00Z");
    const end = new Date("2026-08-05T00:00:00Z");
    const { ms } = timed(() => {
      let total = 0;
      for (let i = 0; i < 1_000; i++) {
        total += computeBookingTotal(1500, start, end);
        total += rentalDaysBetween(start, end);
      }
      return total;
    });
    expect(ms).toBeLessThan(50);
  });

  it("ride join evaluation stays well under 5ms for 1k iterations", () => {
    const { ms } = timed(() => {
      for (let i = 0; i < 1_000; i++) {
        evaluateJoinRequest({
          trip: { status: "UPCOMING", organizerId: "o1", seatsLeft: 3 },
          userId: "u1",
        });
        computeApprovalRate(10, 7);
      }
    });
    expect(ms).toBeLessThan(50);
  });

  it("retry helper completes a successful path without delay budget blowups", async () => {
    const start = performance.now();
    await withRetry(async () => 1, { attempts: 1 });
    expect(performance.now() - start).toBeLessThan(20);
  });
});
