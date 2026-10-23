import { describe, expect, it } from "vitest";
import { adminSubscriptionDisplayState, renewalPeriodLabel } from "./admin-subscription-display";

const activeSub = {
  amount: 99,
  membershipEndDate: "2026-11-22T00:00:00.000Z",
  durationDays: 30,
  subscription: {
    razorpaySubscriptionId: "sub_1",
    status: "active",
    currentPeriodEnd: "2026-11-22T00:00:00.000Z",
    nextPeriodEnd: "2026-12-22T00:00:00.000Z",
    cancelledAt: null,
    renewalCount: 1,
  },
};

describe("adminSubscriptionDisplayState", () => {
  it("active subscription: shows next debit date + amount, renews-on date, and renewal count, read straight from the server", () => {
    const state = adminSubscriptionDisplayState(activeSub);
    expect(state).toMatchObject({
      kind: "active",
      statusLabel: "Active",
      nextDebitDate: "2026-11-22T00:00:00.000Z",
      nextDebitAmount: 99,
      renewsOnDate: "2026-11-22T00:00:00.000Z",
      paidThroughDate: "2026-11-22T00:00:00.000Z",
      renewalCount: 1,
      renewalPeriodLabel: "Monthly",
    });
  });

  it("cancelled subscription: shows cancelledAt and no next debit, and the status badge is NOT 'active'", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, cancelledAt: "2026-10-25T00:00:00.000Z", status: "cancelled" },
    });
    expect(state.kind).toBe("cancelled");
    expect(state).toMatchObject({
      kind: "cancelled",
      statusLabel: "Cancelled",
      paidThroughDate: "2026-11-22T00:00:00.000Z",
      cancelledAtDate: "2026-10-25T00:00:00.000Z",
      renewalCount: 1,
    });
    expect(state).not.toHaveProperty("nextDebitDate");
  });

  it("failed/halted subscription: surfaces the raw status so the admin never has to guess, with no fabricated next-debit date", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, status: "halted" },
    });
    expect(state).toMatchObject({ kind: "payment_problem", statusLabel: "Halted", paidThroughDate: "2026-11-22T00:00:00.000Z" });
    expect(state).not.toHaveProperty("nextDebitDate");
  });

  it("pending subscription: also surfaced as a payment problem, distinct status label from halted", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, status: "pending" },
    });
    expect(state).toMatchObject({ kind: "payment_problem", statusLabel: "Pending" });
  });

  it("initial subscription payment: renewalCount is 0 before any renewal has landed", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, renewalCount: 0 },
    });
    expect(state).toMatchObject({ kind: "active", renewalCount: 0 });
  });

  it("recurring auto-debit: renewalCount increments as more renewals land", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, renewalCount: 4 },
    });
    expect(state).toMatchObject({ kind: "active", renewalCount: 4 });
  });

  it("next debit calculation: changes 1:1 with the server's currentPeriodEnd — proof it is read, not computed", () => {
    const a = adminSubscriptionDisplayState(activeSub);
    const b = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, currentPeriodEnd: "2026-12-22T00:00:00.000Z" },
    });
    expect(a.kind).toBe("active");
    expect(b.kind).toBe("active");
    if (a.kind === "active" && b.kind === "active") {
      expect(a.nextDebitDate).not.toBe(b.nextDebitDate);
      expect(b.nextDebitDate).toBe("2026-12-22T00:00:00.000Z");
      expect(b.renewsOnDate).toBe(b.nextDebitDate);
    }
  });

  it("no-subscription/one-time payment: renders nothing — a Rider or one-time SP purchase has no Auto-Renewal section", () => {
    const state = adminSubscriptionDisplayState({ ...activeSub, subscription: null });
    expect(state).toEqual({ kind: "none" });
  });

  it("cancellation takes priority over a lingering payment-problem status stamped on the same row", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, status: "cancelled", cancelledAt: "2026-10-25T00:00:00.000Z" },
    });
    expect(state.kind).toBe("cancelled");
  });

  it("falls back to the membership's paid-through date if currentPeriodEnd is ever missing on an otherwise-healthy row", () => {
    const state = adminSubscriptionDisplayState({
      ...activeSub,
      subscription: { ...activeSub.subscription, currentPeriodEnd: null },
    });
    expect(state).toMatchObject({ kind: "active", nextDebitDate: "2026-11-22T00:00:00.000Z" });
  });
});

describe("renewalPeriodLabel", () => {
  it("30 days -> Monthly, 365 days -> Yearly, anything else -> explicit day count", () => {
    expect(renewalPeriodLabel(30)).toBe("Monthly");
    expect(renewalPeriodLabel(365)).toBe("Yearly");
    expect(renewalPeriodLabel(7)).toBe("Every 7 days");
  });
});
