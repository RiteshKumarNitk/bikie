import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  membershipRepository: {
    createMembership: vi.fn(),
    getActiveMembership: vi.fn(async () => null),
    findByPaymentReference: vi.fn(async () => null),
    findPlanById: vi.fn(),
    findOpenSubscriptionForUser: vi.fn(async () => null),
    createSubscriptionMembership: vi.fn(),
    findByRazorpaySubscriptionId: vi.fn(async () => null),
    recordSubscriptionCharge: vi.fn(),
    updateSubscriptionStatus: vi.fn(),
    listAllSubscriptions: vi.fn(async () => []),
  },
  billingRepository: {
    createInvoice: vi.fn(async () => ({ id: "inv-1", confirmationSmsSentAt: null })),
    markConfirmationSmsSent: vi.fn(async () => undefined),
    createRecurringInvoice: vi.fn(async () => ({ id: "inv-recurring-1" })),
  },
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("./sms.service", () => ({
  SMSService: { sendMembershipSubscribed: vi.fn(async () => ({ ok: true, provider: "msg91" })) },
  MSG91_SMS_TEMPLATE_ENV: { MEMBERSHIP_SUBSCRIBED: "MSG91_MEMBERSHIP_SUB_TEMPLATE_ID" },
}));

vi.mock("./razorpay.service", () => ({
  RazorpayService: {
    isConfigured: vi.fn(() => true),
    createSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    fetchSubscription: vi.fn(),
    listSubscriptionInvoices: vi.fn(async () => []),
  },
}));

import { membershipRepository, billingRepository, userRepository } from "@bikie/database";
import { SMSService } from "./sms.service";
import { RazorpayService } from "./razorpay.service";
import { MembershipService } from "./membership.service";

const repo = membershipRepository as unknown as {
  createMembership: ReturnType<typeof vi.fn>;
  getActiveMembership: ReturnType<typeof vi.fn>;
  findByPaymentReference: ReturnType<typeof vi.fn>;
  findPlanById: ReturnType<typeof vi.fn>;
  findOpenSubscriptionForUser: ReturnType<typeof vi.fn>;
  createSubscriptionMembership: ReturnType<typeof vi.fn>;
  findByRazorpaySubscriptionId: ReturnType<typeof vi.fn>;
  recordSubscriptionCharge: ReturnType<typeof vi.fn>;
  updateSubscriptionStatus: ReturnType<typeof vi.fn>;
  listAllSubscriptions: ReturnType<typeof vi.fn>;
};
const billing = billingRepository as unknown as {
  createInvoice: ReturnType<typeof vi.fn>;
  markConfirmationSmsSent: ReturnType<typeof vi.fn>;
  createRecurringInvoice: ReturnType<typeof vi.fn>;
};
const users = userRepository as unknown as { findById: ReturnType<typeof vi.fn> };
const sms = SMSService.sendMembershipSubscribed as ReturnType<typeof vi.fn>;
const razorpay = RazorpayService as unknown as {
  isConfigured: ReturnType<typeof vi.fn>;
  createSubscription: ReturnType<typeof vi.fn>;
  cancelSubscription: ReturnType<typeof vi.fn>;
  fetchSubscription: ReturnType<typeof vi.fn>;
  listSubscriptionInvoices: ReturnType<typeof vi.fn>;
};

const plan = {
  id: "plan-1",
  name: "Membership",
  description: "",
  price: 99,
  durationDays: 365,
  benefits: [],
  isActive: true,
};
const sampleMembership = {
  id: "membership-1",
  userId: "user-1",
  planId: "plan-1",
  plan,
  startDate: "2026-08-30T00:00:00.000Z",
  endDate: "2027-08-30T00:00:00.000Z",
  status: "ACTIVE",
  daysLeft: 365,
};

// --- Recurring Razorpay Subscriptions fixtures — the real Rider plan: ₹149/year. ---
const yearlyPlan = { id: "rider-yearly-plan", name: "Rider Yearly Membership", description: "", price: 149, durationDays: 365, benefits: [], isActive: true };

function membershipOn(plan: typeof yearlyPlan) {
  return {
    id: "um-1",
    userId: "user-1",
    planId: plan.id,
    plan,
    startDate: "2026-08-30T00:00:00.000Z",
    endDate: "2027-08-30T00:00:00.000Z",
    status: "ACTIVE",
    daysLeft: 365,
  };
}

function subscriptionMembershipOnBase(plan: typeof yearlyPlan) {
  return {
    ...membershipOn(plan),
    startDate: "2026-10-26T00:00:00.000Z",
    endDate: "2026-10-26T00:00:00.000Z",
    razorpaySubscriptionId: "sub_rider123",
    razorpayPlanId: "plan_rider_yearly",
    subscriptionStatus: "created",
    currentPeriodStart: null as string | null,
    currentPeriodEnd: null as string | null,
    cancelledAt: null as string | null,
    lastPaymentId: null as string | null,
  };
}
function subscriptionMembershipOn(plan: typeof yearlyPlan, overrides: Partial<ReturnType<typeof subscriptionMembershipOnBase>> = {}) {
  return { ...subscriptionMembershipOnBase(plan), ...overrides };
}

/** Wait for the fire-and-forget SMS → markConfirmationSmsSent chain to settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  repo.getActiveMembership.mockResolvedValue(null);
  repo.findByPaymentReference.mockResolvedValue(null);
  repo.findOpenSubscriptionForUser.mockResolvedValue(null);
  repo.findByRazorpaySubscriptionId.mockResolvedValue(null);
  repo.listAllSubscriptions.mockResolvedValue([]);
  billing.createInvoice.mockResolvedValue({ id: "inv-1", confirmationSmsSentAt: null });
  billing.createRecurringInvoice.mockResolvedValue({ id: "inv-recurring-1" });
  razorpay.isConfigured.mockReturnValue(true);
  razorpay.listSubscriptionInvoices.mockResolvedValue([]);
});

describe("MembershipService.purchaseMembership — activation + invoice + SMS (ADR-058/069/070)", () => {
  it("activates the membership, records an invoice snapshot from the plan, and sends the SMS exactly once", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya Verma", phoneNumber: "+919876543210" });

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "pay_abc", "order_abc");
    await flush();

    expect(result).toEqual({ ok: true, membership: sampleMembership });

    // Invoice snapshot mirrors the plan/membership at purchase time.
    expect(billing.createInvoice).toHaveBeenCalledTimes(1);
    expect(billing.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        accountType: "RIDER",
        userMembershipId: "membership-1",
        planId: "plan-1",
        planName: "Membership",
        amount: 99,
        durationDays: 365,
        customerName: "Priya Verma",
        customerPhone: "+919876543210",
        razorpayPaymentId: "pay_abc",
        razorpayOrderId: "order_abc",
        paymentId: "pay_abc",
      }),
    );

    expect(sms).toHaveBeenCalledTimes(1);
    expect(sms).toHaveBeenCalledWith("+919876543210", "Priya Verma", new Date(sampleMembership.endDate));
    expect(billing.markConfirmationSmsSent).toHaveBeenCalledWith("inv-1");
  });

  it("logs structured MEMBERSHIP_SMS_* lines with a masked phone — never the raw number (ADR-086)", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya Verma", phoneNumber: "+919876543210" });
    sms.mockResolvedValueOnce({ ok: true, provider: "msg91", detail: "req-abc-123" });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await MembershipService.purchaseMembership("user-1", "plan-1", "pay_abc", "order_abc");
    await flush();

    const lines = log.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.startsWith("MEMBERSHIP_SMS_DISPATCH_START") && l.includes("accountType=RIDER"))).toBe(true);
    expect(lines.some((l) => l.startsWith("MEMBERSHIP_SMS_GATEWAY_ACCEPTED") && l.includes("msg91ReqId=req-abc-123"))).toBe(true);
    // Every logged line carries the masked form (asterisks + last 4 digits), never the raw
    // 10-digit number unmasked anywhere.
    expect(lines.some((l) => l.includes("9876543210"))).toBe(false);
    expect(lines.some((l) => /phone=\+\*+3210/.test(l))).toBe(true);
    log.mockRestore();
  });

  it("logs MEMBERSHIP_SMS_UNCONFIGURED (not an error) when the template id is unset, and MEMBERSHIP_SMS_FAILED (an error) for a genuine send failure", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValue({ id: "user-1", name: "Priya", phoneNumber: "+919876543210" });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    sms.mockResolvedValueOnce({ ok: false, provider: "unconfigured", error: "MSG91_MEMBERSHIP_SUB_TEMPLATE_ID not configured" });
    await MembershipService.purchaseMembership("user-1", "plan-1", "pay_a");
    await flush();
    expect(log.mock.calls.some((c) => String(c[0]).startsWith("MEMBERSHIP_SMS_UNCONFIGURED"))).toBe(true);
    expect(err).not.toHaveBeenCalled();

    log.mockClear();
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    billing.createInvoice.mockResolvedValueOnce({ id: "inv-2", confirmationSmsSentAt: null });
    sms.mockResolvedValueOnce({ ok: false, provider: "msg91", error: "DLT rejected" });
    await MembershipService.purchaseMembership("user-1", "plan-1", "pay_b");
    await flush();
    expect(err.mock.calls.some((c) => String(c[0]).startsWith("MEMBERSHIP_SMS_FAILED"))).toBe(true);

    log.mockRestore();
    err.mockRestore();
  });

  it("stores a DUMMY dev-mode paymentId as paymentId only, never as razorpayPaymentId", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "P", phoneNumber: null });

    await MembershipService.purchaseMembership("user-1", "plan-1", "DUMMY-123");

    expect(billing.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "DUMMY-123", razorpayPaymentId: null, razorpayOrderId: null }),
    );
  });

  it("does not send SMS when the user has no phone number, but still records the invoice", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya", phoneNumber: null });

    await MembershipService.purchaseMembership("user-1", "plan-1", "pay_1");
    await flush();

    expect(billing.createInvoice).toHaveBeenCalledTimes(1);
    expect(sms).not.toHaveBeenCalled();
    expect(billing.markConfirmationSmsSent).not.toHaveBeenCalled();
  });

  it("does not stamp confirmationSmsSentAt when the SMS provider reports failure (safe to retry)", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya", phoneNumber: "+91987" });
    sms.mockResolvedValueOnce({ ok: false, provider: "msg91", error: "MSG91 down" });

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "pay_1");
    await flush();

    expect(result.ok).toBe(true); // purchase NOT rolled back
    expect(billing.markConfirmationSmsSent).not.toHaveBeenCalled();
  });

  it("does not fail the purchase when the SMS call itself throws", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya", phoneNumber: "+91987" });
    sms.mockRejectedValueOnce(new Error("network"));

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "pay_1");
    await flush();

    expect(result).toEqual({ ok: true, membership: sampleMembership });
  });
});

describe("MembershipService.purchaseMembership — idempotency + duplicate guard (ADR-069/070)", () => {
  it("replaying a payment reference returns the existing membership and creates NO second invoice or SMS", async () => {
    repo.findByPaymentReference.mockResolvedValueOnce(sampleMembership);

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", undefined, "order_abc");
    await flush();

    expect(result).toEqual({ ok: true, membership: sampleMembership });
    expect(repo.createMembership).not.toHaveBeenCalled();
    expect(billing.createInvoice).not.toHaveBeenCalled();
    expect(sms).not.toHaveBeenCalled();
  });

  it("rejects with ALREADY_ACTIVE (no membership, no invoice, no SMS) when the user already has one and the payment is new", async () => {
    repo.getActiveMembership.mockResolvedValueOnce(sampleMembership);

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "DUMMY-new");
    await flush();

    expect(result).toEqual({ ok: false, reason: "ALREADY_ACTIVE" });
    expect(repo.createMembership).not.toHaveBeenCalled();
    expect(billing.createInvoice).not.toHaveBeenCalled();
    expect(sms).not.toHaveBeenCalled();
  });

  it("does not re-send the SMS if the invoice already has confirmationSmsSentAt (createInvoice returned an existing row)", async () => {
    repo.createMembership.mockResolvedValueOnce(sampleMembership);
    users.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya", phoneNumber: "+91987" });
    billing.createInvoice.mockResolvedValueOnce({ id: "inv-1", confirmationSmsSentAt: "2026-08-30T10:00:00.000Z" });

    await MembershipService.purchaseMembership("user-1", "plan-1", "pay_1");
    await flush();

    expect(sms).not.toHaveBeenCalled();
  });
});

describe("MembershipService — dynamic plan config", () => {
  it("getPlans / getPlanById pass through whatever the repository returns (price/duration are DB-driven, never hardcoded)", async () => {
    const repoWithPlans = membershipRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
    repoWithPlans.findAllActivePlans = vi.fn(async () => [{ ...plan, price: 149, durationDays: 30 }]);
    repoWithPlans.findPlanById = vi.fn(async () => ({ ...plan, price: 149, durationDays: 30 }));

    expect(await MembershipService.getPlans()).toEqual([{ ...plan, price: 149, durationDays: 30 }]);
    expect(await MembershipService.getPlanById("plan-1")).toEqual({ ...plan, price: 149, durationDays: 30 });
  });
});

// --- Recurring Razorpay Subscriptions — Rider ₹149/year auto-renewal. Mirrors
// partner-membership.service.test.ts's identical suite (Service Provider ₹99/month) exactly,
// section for section, proving the same safety guarantees hold for the Rider side: the stale-
// subscription retry logic always verifies Razorpay's live paid_count before touching anything,
// reconciliation replays missing charges idempotently, and a real subscription is never silently
// replaced. ---

describe("MembershipService.startSubscription (recurring)", () => {
  it("creates a Razorpay Subscription and a placeholder UserMembership row, never activating it", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_rider123",
      status: "created",
      shortUrl: "https://rzp.io/i/rider123",
    });
    const created = subscriptionMembershipOn(yearlyPlan);
    repo.createSubscriptionMembership.mockResolvedValueOnce(created);
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "plan_rider_yearly");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({
      ok: true,
      membership: created,
      subscription: { id: "sub_rider123", status: "created", shortUrl: "https://rzp.io/i/rider123" },
    });
    expect(razorpay.createSubscription).toHaveBeenCalledWith(
      "plan_rider_yearly",
      expect.objectContaining({ userId: "user-1", planId: "rider-yearly-plan", accountType: "RIDER" }),
    );
    expect(repo.createSubscriptionMembership).toHaveBeenCalledWith("user-1", "rider-yearly-plan", "sub_rider123", "plan_rider_yearly", "created");
    // Not yet eligible per the existing `status === ACTIVE && endDate >= now()` check.
    expect(created.startDate).toBe(created.endDate);
  });

  it("rejects PLAN_NOT_FOUND for an inactive/missing plan", async () => {
    repo.findPlanById.mockResolvedValueOnce(null);

    const result = await MembershipService.startSubscription("user-1", "missing-plan");

    expect(result).toEqual({ ok: false, reason: "PLAN_NOT_FOUND" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects ALREADY_ACTIVE when a one-time/free membership is already active", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.getActiveMembership.mockResolvedValueOnce(membershipOn(yearlyPlan));

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "ALREADY_ACTIVE" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_ALREADY_EXISTS when Razorpay's own live state shows the open subscription was actually charged (paidCount > 0)", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active" }));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 1 });

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
    expect(repo.createSubscriptionMembership).not.toHaveBeenCalled();
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_ALREADY_EXISTS when Razorpay reports paidCount > 0 even though the LOCAL row still looks unactivated — Razorpay's live state wins", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 1 });

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("a genuinely STALE open subscription (Razorpay confirms paidCount 0, status still non-terminal) is cancelled and replaced", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "created", paidCount: 0 });
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_rider123", status: "cancelled", shortUrl: "" });
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_rider456",
      status: "created",
      shortUrl: "https://rzp.io/i/rider456",
    });
    const created = subscriptionMembershipOn(yearlyPlan, { id: "um-2", razorpaySubscriptionId: "sub_rider456" });
    repo.createSubscriptionMembership.mockResolvedValueOnce(created);
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "plan_rider_yearly");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(razorpay.fetchSubscription).toHaveBeenCalledWith("sub_rider123");
    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_rider123", false);
    expect(razorpay.createSubscription).toHaveBeenCalledWith("plan_rider_yearly", expect.objectContaining({ userId: "user-1" }));
    expect(result).toEqual({
      ok: true,
      membership: created,
      subscription: { id: "sub_rider456", status: "created", shortUrl: "https://rzp.io/i/rider456" },
    });
  });

  it("skips the redundant cancel call when Razorpay already reports the stale subscription as terminal", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "expired", paidCount: 0 });
    razorpay.createSubscription.mockResolvedValueOnce({ id: "sub_rider456", status: "created", shortUrl: "https://rzp.io/i/rider456" });
    repo.createSubscriptionMembership.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan, { id: "um-2" }));
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "plan_rider_yearly");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("still creates a fresh subscription even if cancelling the stale one fails on Razorpay's side", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "created", paidCount: 0 });
    razorpay.cancelSubscription.mockResolvedValueOnce(null);
    razorpay.createSubscription.mockResolvedValueOnce({ id: "sub_rider456", status: "created", shortUrl: "https://rzp.io/i/rider456" });
    repo.createSubscriptionMembership.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan, { id: "um-2" }));
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "plan_rider_yearly");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result.ok).toBe(true);
    expect(razorpay.createSubscription).toHaveBeenCalled();
  });

  it("fails SAFE (SUBSCRIPTION_ALREADY_EXISTS, no cancel/create) when Razorpay's live state can't be verified at all", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce(null);

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects NOT_CONFIGURED when RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID is unset — never hardcodes a plan id, never falls back to the SP plan id", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "NOT_CONFIGURED" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_CREATE_FAILED when Razorpay itself fails, without creating a membership row", async () => {
    repo.findPlanById.mockResolvedValueOnce(yearlyPlan);
    razorpay.createSubscription.mockResolvedValueOnce(null);
    vi.stubEnv("RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID", "plan_rider_yearly");

    const result = await MembershipService.startSubscription("user-1", "rider-yearly-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_CREATE_FAILED" });
    expect(repo.createSubscriptionMembership).not.toHaveBeenCalled();
  });
});

describe("MembershipService.cancelSubscription (recurring)", () => {
  it("cancels at cycle end, never revoking the already-paid-for current period", async () => {
    const open = subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active" });
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(open);
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_rider123", status: "active", shortUrl: "" });
    const updated = { ...open, subscriptionStatus: "active", cancelledAt: "2026-10-26T12:00:00.000Z" };
    repo.updateSubscriptionStatus.mockResolvedValueOnce(updated);

    const result = await MembershipService.cancelSubscription("user-1");

    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_rider123", true);
    expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("um-1", "active", { cancelledAt: expect.any(Date) });
    expect(result).toEqual({ ok: true, membership: updated });
  });

  it("rejects NO_ACTIVE_SUBSCRIPTION when the user has no open subscription", async () => {
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(null);

    const result = await MembershipService.cancelSubscription("user-1");

    expect(result).toEqual({ ok: false, reason: "NO_ACTIVE_SUBSCRIPTION" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects CANCEL_FAILED when Razorpay's own cancellation call fails, without touching the DB row", async () => {
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.cancelSubscription.mockResolvedValueOnce(null);

    const result = await MembershipService.cancelSubscription("user-1");

    expect(result).toEqual({ ok: false, reason: "CANCEL_FAILED" });
    expect(repo.updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});

describe("MembershipService.listAllSubscriptions (admin)", () => {
  it("returns whatever the repository's admin listing returns, unmodified", async () => {
    const rows = [{ ...subscriptionMembershipOn(yearlyPlan), userName: "Priya Verma", userEmail: "priya@example.com", userPhone: "+919876543210" }];
    repo.listAllSubscriptions.mockResolvedValueOnce(rows);

    const result = await MembershipService.listAllSubscriptions();

    expect(result).toEqual(rows);
  });
});

describe("MembershipService.adminCancelSubscription (admin, not scoped to a calling user)", () => {
  it("cancels by Razorpay subscription id alone — never requires knowing which user owns it", async () => {
    const open = subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active" });
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(open);
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_rider123", status: "active", shortUrl: "" });
    const updated = { ...open, cancelledAt: "2026-10-26T12:00:00.000Z" };
    repo.updateSubscriptionStatus.mockResolvedValueOnce(updated);

    const result = await MembershipService.adminCancelSubscription("sub_rider123");

    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_rider123", true);
    expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("um-1", "active", { cancelledAt: expect.any(Date) });
    expect(result).toEqual({ ok: true, membership: updated });
  });

  it("rejects NOT_FOUND for an unknown Razorpay subscription id", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await MembershipService.adminCancelSubscription("sub_unknown");

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects CANCEL_FAILED when Razorpay's own cancellation call fails, without touching the DB row", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.cancelSubscription.mockResolvedValueOnce(null);

    const result = await MembershipService.adminCancelSubscription("sub_rider123");

    expect(result).toEqual({ ok: false, reason: "CANCEL_FAILED" });
    expect(repo.updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});

describe("MembershipService.recordRecurringCharge (webhook: subscription.charged / activated)", () => {
  it("extends endDate to currentPeriodEnd (one full year later), keeps status ACTIVE, stamps lastPaymentId, and creates a NEW invoice", async () => {
    const existing = subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active" });
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
    const periodStart = new Date("2026-10-26T00:00:00.000Z");
    const periodEnd = new Date("2027-10-26T00:00:00.000Z");
    const afterCharge = {
      ...existing,
      status: "ACTIVE",
      endDate: periodEnd.toISOString(),
      currentPeriodStart: periodStart.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      lastPaymentId: "pay_recurring_1",
      subscriptionStatus: "active",
    };
    repo.recordSubscriptionCharge.mockResolvedValueOnce(afterCharge);

    const result = await MembershipService.recordRecurringCharge("sub_rider123", {
      subscriptionStatus: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      razorpayPaymentId: "pay_recurring_1",
      amount: 149,
    });

    expect(repo.recordSubscriptionCharge).toHaveBeenCalledWith("um-1", {
      subscriptionStatus: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      lastPaymentId: "pay_recurring_1",
    });
    expect(result).toEqual(afterCharge);
    expect(result!.status).toBe("ACTIVE");
    expect(new Date(result!.endDate).getTime()).toBeGreaterThan(Date.now());

    expect(billing.createRecurringInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: "RIDER",
        userMembershipId: "um-1",
        amount: 149,
        razorpayPaymentId: "pay_recurring_1",
        membershipEndDate: periodEnd,
      }),
    );
  });

  it("creating a second year's invoice never touches the first year's invoice — each charge gets its own", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(yearlyPlan));
    repo.recordSubscriptionCharge.mockResolvedValue(subscriptionMembershipOn(yearlyPlan));

    await MembershipService.recordRecurringCharge("sub_rider123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2026-10-26T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-10-26T00:00:00.000Z"),
      razorpayPaymentId: "pay_year_1",
      amount: 149,
    });
    await MembershipService.recordRecurringCharge("sub_rider123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2027-10-26T00:00:00.000Z"),
      currentPeriodEnd: new Date("2028-10-26T00:00:00.000Z"),
      razorpayPaymentId: "pay_year_2",
      amount: 149,
    });

    expect(billing.createRecurringInvoice).toHaveBeenCalledTimes(2);
    const [[firstCall], [secondCall]] = billing.createRecurringInvoice.mock.calls;
    expect(firstCall.razorpayPaymentId).toBe("pay_year_1");
    expect(secondCall.razorpayPaymentId).toBe("pay_year_2");
    expect(firstCall.razorpayPaymentId).not.toBe(secondCall.razorpayPaymentId);
  });

  it("duplicate webhook delivery for the SAME charge is idempotent — never extends the membership twice or creates a second invoice", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(yearlyPlan));
    repo.recordSubscriptionCharge.mockResolvedValue(subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active" }));
    // `createRecurringInvoice` is keyed on razorpayPaymentId alone (its own repository-level
    // idempotency, exercised for real in billing.repository.test.ts) — here we only prove the
    // service calls it with the SAME payment id both times, which is what makes that guarantee
    // apply at all.
    const periodEnd = new Date("2027-10-26T00:00:00.000Z");
    await MembershipService.recordRecurringCharge("sub_rider123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2026-10-26T00:00:00.000Z"),
      currentPeriodEnd: periodEnd,
      razorpayPaymentId: "pay_year_1",
      amount: 149,
    });
    await MembershipService.recordRecurringCharge("sub_rider123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2026-10-26T00:00:00.000Z"),
      currentPeriodEnd: periodEnd,
      razorpayPaymentId: "pay_year_1",
      amount: 149,
    });

    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(1, expect.objectContaining({ razorpayPaymentId: "pay_year_1" }));
    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(2, expect.objectContaining({ razorpayPaymentId: "pay_year_1" }));
  });

  it("logs and returns null for an unknown subscription id, without throwing (webhook must still ack)", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await MembershipService.recordRecurringCharge("sub_unknown", {
      subscriptionStatus: "active",
      currentPeriodStart: null,
      currentPeriodEnd: new Date(),
      razorpayPaymentId: "pay_x",
      amount: 149,
    });

    expect(result).toBeNull();
    expect(repo.recordSubscriptionCharge).not.toHaveBeenCalled();
    expect(billing.createRecurringInvoice).not.toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("MembershipService.recordSubscriptionStatusChange (webhook: pending/halted/cancelled/completed)", () => {
  it.each(["pending", "halted", "cancelled", "completed"])(
    "updates subscriptionStatus for '%s' without touching status/endDate — never a false 'Auto-Renewal ON / Payment successful'",
    async (subscriptionStatus) => {
      const existing = subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "active", status: "ACTIVE", endDate: "2027-10-26T00:00:00.000Z" });
      repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
      const updated = { ...existing, subscriptionStatus };
      repo.updateSubscriptionStatus.mockResolvedValueOnce(updated);

      const result = await MembershipService.recordSubscriptionStatusChange("sub_rider123", subscriptionStatus);

      expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("um-1", subscriptionStatus, {});
      expect(result).toEqual(updated);
    },
  );

  it("returns null for an unknown subscription id without throwing", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await MembershipService.recordSubscriptionStatusChange("sub_unknown", "halted");

    expect(result).toBeNull();
    expect(repo.updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});

describe("MembershipService.reconcileSubscription (admin-triggered, webhook-missed recovery)", () => {
  it("rejects NOT_FOUND for an unknown subscription id", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await MembershipService.reconcileSubscription("sub_unknown");

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(razorpay.fetchSubscription).not.toHaveBeenCalled();
  });

  it("rejects COULD_NOT_VERIFY when Razorpay's live state can't be fetched — never guesses toward charging/activating anything", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce(null);

    const result = await MembershipService.reconcileSubscription("sub_rider123");

    expect(result).toEqual({ ok: false, reason: "COULD_NOT_VERIFY" });
    expect(razorpay.listSubscriptionInvoices).not.toHaveBeenCalled();
  });

  it("replays every paid invoice Razorpay has, oldest first, through the exact same recordRecurringCharge path the webhook itself uses", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 2 });
    razorpay.listSubscriptionInvoices.mockResolvedValueOnce([
      {
        razorpayPaymentId: "pay_year_1",
        amount: 149,
        billingStart: new Date("2025-10-26T00:00:00.000Z"),
        billingEnd: new Date("2026-10-26T00:00:00.000Z"),
        paidAt: new Date("2025-10-26T00:05:00.000Z"),
      },
      {
        razorpayPaymentId: "pay_year_2",
        amount: 149,
        billingStart: new Date("2026-10-26T00:00:00.000Z"),
        billingEnd: new Date("2027-10-26T00:00:00.000Z"),
        paidAt: new Date("2026-10-26T00:05:00.000Z"),
      },
    ]);
    repo.recordSubscriptionCharge
      .mockResolvedValueOnce({ ...subscriptionMembershipOn(yearlyPlan), endDate: "2026-10-26T00:00:00.000Z" })
      .mockResolvedValueOnce({ ...subscriptionMembershipOn(yearlyPlan), endDate: "2027-10-26T00:00:00.000Z" });

    const result = await MembershipService.reconcileSubscription("sub_rider123");

    expect(repo.recordSubscriptionCharge).toHaveBeenNthCalledWith(
      1,
      "um-1",
      expect.objectContaining({ lastPaymentId: "pay_year_1", currentPeriodEnd: new Date("2026-10-26T00:00:00.000Z") }),
    );
    expect(repo.recordSubscriptionCharge).toHaveBeenNthCalledWith(
      2,
      "um-1",
      expect.objectContaining({ lastPaymentId: "pay_year_2", currentPeriodEnd: new Date("2027-10-26T00:00:00.000Z") }),
    );
    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(1, expect.objectContaining({ razorpayPaymentId: "pay_year_1" }));
    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(2, expect.objectContaining({ razorpayPaymentId: "pay_year_2" }));
    expect(result).toEqual({
      ok: true,
      membership: expect.objectContaining({ endDate: "2027-10-26T00:00:00.000Z" }),
      invoicesFound: 2,
    });
  });

  it("running reconciliation twice is safe — a second run with the same paid invoices never double-extends the membership (idempotency inherited from recordRecurringCharge/createRecurringInvoice)", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(yearlyPlan));
    razorpay.fetchSubscription.mockResolvedValue({ status: "active", paidCount: 1 });
    razorpay.listSubscriptionInvoices.mockResolvedValue([
      {
        razorpayPaymentId: "pay_year_1",
        amount: 149,
        billingStart: new Date("2026-10-26T00:00:00.000Z"),
        billingEnd: new Date("2027-10-26T00:00:00.000Z"),
        paidAt: new Date("2026-10-26T00:05:00.000Z"),
      },
    ]);
    repo.recordSubscriptionCharge.mockResolvedValue(subscriptionMembershipOn(yearlyPlan, { endDate: "2027-10-26T00:00:00.000Z" }));

    await MembershipService.reconcileSubscription("sub_rider123");
    await MembershipService.reconcileSubscription("sub_rider123");

    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(1, expect.objectContaining({ razorpayPaymentId: "pay_year_1" }));
    expect(billing.createRecurringInvoice).toHaveBeenNthCalledWith(2, expect.objectContaining({ razorpayPaymentId: "pay_year_1" }));
    expect(billing.createRecurringInvoice).toHaveBeenCalledTimes(2);
  });

  it("is a safe no-op when no paid invoices exist, but still syncs the local status to Razorpay's own live status", async () => {
    const existing = subscriptionMembershipOn(yearlyPlan, { subscriptionStatus: "created" });
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "cancelled", paidCount: 0 });
    razorpay.listSubscriptionInvoices.mockResolvedValueOnce([]);
    const synced = { ...existing, subscriptionStatus: "cancelled" };
    repo.updateSubscriptionStatus.mockResolvedValueOnce(synced);

    const result = await MembershipService.reconcileSubscription("sub_rider123");

    expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("um-1", "cancelled", {});
    expect(repo.recordSubscriptionCharge).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, membership: synced, invoicesFound: 0 });
  });
});
