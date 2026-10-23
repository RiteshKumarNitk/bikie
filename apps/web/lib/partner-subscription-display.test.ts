import { describe, expect, it } from "vitest";
import { formatMembershipDate, subscriptionDisplayState } from "./partner-subscription-display";

const base = {
  endDate: "2026-11-15T00:00:00.000Z",
  razorpaySubscriptionId: "sub_abc123",
  subscriptionStatus: "active",
  currentPeriodStart: "2026-10-15T00:00:00.000Z",
  currentPeriodEnd: "2026-11-15T00:00:00.000Z",
  cancelledAt: null,
};

describe("subscriptionDisplayState", () => {
  it("1. an active, healthy subscription shows the next payment date from currentPeriodEnd — never computed client-side", () => {
    const state = subscriptionDisplayState(base);
    expect(state).toMatchObject({ kind: "active", nextPaymentDate: formatMembershipDate(base.currentPeriodEnd) });
  });

  it("3. the current period's start date comes from currentPeriodStart, not guessed from endDate", () => {
    const state = subscriptionDisplayState(base);
    expect(state).toMatchObject({ kind: "active", periodStartDate: formatMembershipDate(base.currentPeriodStart) });
  });

  it("3b. a healthy subscription with no currentPeriodStart yet (first webhook hasn't landed) shows no period start, not a fabricated one", () => {
    const state = subscriptionDisplayState({ ...base, currentPeriodStart: null });
    expect(state).toMatchObject({ kind: "active", periodStartDate: null });
  });

  it("4. a cancelled subscription never shows a future auto-payment date", () => {
    const state = subscriptionDisplayState({ ...base, cancelledAt: "2026-10-20T00:00:00.000Z" });
    expect(state.kind).toBe("cancelled");
    expect(state).not.toHaveProperty("nextPaymentDate");
    expect(state).toMatchObject({ validUntilDate: formatMembershipDate(base.endDate) });
  });

  it("5. a halted (failed) payment shows the correct 'Failed' warning, with the membership's real valid-until date", () => {
    const state = subscriptionDisplayState({ ...base, subscriptionStatus: "halted" });
    expect(state).toMatchObject({
      kind: "payment_problem",
      statusLabel: "Failed",
      validUntilDate: formatMembershipDate(base.endDate),
    });
  });

  it("5b. a pending payment shows 'Pending', distinct from a halted/failed one", () => {
    const state = subscriptionDisplayState({ ...base, subscriptionStatus: "pending" });
    expect(state).toMatchObject({ kind: "payment_problem", statusLabel: "Pending" });
  });

  it("6. the renewal/next-payment date changes 1:1 with the server's currentPeriodEnd — proof it is read, not computed", () => {
    const stateA = subscriptionDisplayState({ ...base, currentPeriodEnd: "2026-11-15T00:00:00.000Z" });
    const stateB = subscriptionDisplayState({ ...base, currentPeriodEnd: "2026-12-20T00:00:00.000Z" });
    expect(stateA.kind).toBe("active");
    expect(stateB.kind).toBe("active");
    if (stateA.kind === "active" && stateB.kind === "active") {
      expect(stateA.nextPaymentDate).not.toBe(stateB.nextPaymentDate);
      expect(stateB.nextPaymentDate).toBe(formatMembershipDate("2026-12-20T00:00:00.000Z"));
      expect(stateB.renewalDate).toBe(stateB.nextPaymentDate);
    }
  });

  it("a one-time/free membership (no razorpaySubscriptionId) renders no subscription section at all", () => {
    const state = subscriptionDisplayState({ ...base, razorpaySubscriptionId: null, subscriptionStatus: null, currentPeriodStart: null, currentPeriodEnd: null });
    expect(state).toEqual({ kind: "none" });
  });

  it("cancellation takes priority over a lingering payment-problem status on the same row (Razorpay-initiated cancel stamps both)", () => {
    const state = subscriptionDisplayState({ ...base, subscriptionStatus: "cancelled", cancelledAt: "2026-10-20T00:00:00.000Z" });
    expect(state.kind).toBe("cancelled");
  });

  it("falls back to endDate for the next-payment date only if currentPeriodEnd is ever missing on an otherwise-healthy row", () => {
    const state = subscriptionDisplayState({ ...base, currentPeriodEnd: null });
    expect(state).toMatchObject({ kind: "active", nextPaymentDate: formatMembershipDate(base.endDate) });
  });
});

describe("formatMembershipDate", () => {
  it("renders as 'DD Month YYYY'", () => {
    expect(formatMembershipDate("2026-11-15T00:00:00.000Z")).toBe("15 November 2026");
  });
});
