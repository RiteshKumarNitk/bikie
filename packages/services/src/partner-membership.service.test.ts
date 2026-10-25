import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  partnerMembershipRepository: {
    createMembership: vi.fn(),
    getActiveMembership: vi.fn(async () => null),
    findByPaymentReference: vi.fn(async () => null),
    findPlanById: vi.fn(),
    findOpenSubscriptionForUser: vi.fn(async () => null),
    createSubscriptionMembership: vi.fn(),
    findByRazorpaySubscriptionId: vi.fn(async () => null),
    recordSubscriptionCharge: vi.fn(),
    updateSubscriptionStatus: vi.fn(),
  },
  billingRepository: {
    createInvoice: vi.fn(async () => ({ id: "inv-1", confirmationSmsSentAt: null })),
    markConfirmationSmsSent: vi.fn(async () => undefined),
    createRecurringPartnerInvoice: vi.fn(async () => ({ id: "inv-recurring-1" })),
  },
  razorpayWebhookRepository: {
    tryClaimEvent: vi.fn(async () => true),
  },
  userRepository: {
    findById: vi.fn(async () => ({ id: "user-1", name: "Ravi Kumar", phoneNumber: "+919000000000" })),
  },
}));

// Guard: the Rider "BIKIE_Sub" SMS must never be sent for a Service Provider purchase (ADR-058).
// `sendPartnerMembershipSubscribed` (ADR-080) is the SP-specific sender under test below.
vi.mock("./sms.service", () => ({
  SMSService: {
    sendMembershipSubscribed: vi.fn(),
    sendPartnerMembershipSubscribed: vi.fn(async () => ({ ok: false, provider: "unconfigured" })),
  },
  MSG91_SMS_TEMPLATE_ENV: { PARTNER_MEMBERSHIP_SUBSCRIBED: "MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID" },
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

import { partnerMembershipRepository, billingRepository, razorpayWebhookRepository } from "@bikie/database";
import { SMSService } from "./sms.service";
import { RazorpayService } from "./razorpay.service";
import { PartnerMembershipService } from "./partner-membership.service";

const repo = partnerMembershipRepository as unknown as {
  createMembership: ReturnType<typeof vi.fn>;
  getActiveMembership: ReturnType<typeof vi.fn>;
  findByPaymentReference: ReturnType<typeof vi.fn>;
  findPlanById: ReturnType<typeof vi.fn>;
  findOpenSubscriptionForUser: ReturnType<typeof vi.fn>;
  createSubscriptionMembership: ReturnType<typeof vi.fn>;
  findByRazorpaySubscriptionId: ReturnType<typeof vi.fn>;
  recordSubscriptionCharge: ReturnType<typeof vi.fn>;
  updateSubscriptionStatus: ReturnType<typeof vi.fn>;
};
const billing = billingRepository as unknown as {
  createInvoice: ReturnType<typeof vi.fn>;
  markConfirmationSmsSent: ReturnType<typeof vi.fn>;
  createRecurringPartnerInvoice: ReturnType<typeof vi.fn>;
};
const webhookRepo = razorpayWebhookRepository as unknown as { tryClaimEvent: ReturnType<typeof vi.fn> };
const razorpay = RazorpayService as unknown as {
  isConfigured: ReturnType<typeof vi.fn>;
  createSubscription: ReturnType<typeof vi.fn>;
  cancelSubscription: ReturnType<typeof vi.fn>;
  fetchSubscription: ReturnType<typeof vi.fn>;
  listSubscriptionInvoices: ReturnType<typeof vi.fn>;
};

const paidPlan = { id: "sp-plan", name: "Service Provider Membership", description: "", price: 99, durationDays: 30, benefits: [], isActive: true };
const freePlan = { ...paidPlan, id: "sp-free", name: "Standard (Legacy)", price: 0, durationDays: 36500 };

function membershipOn(plan: typeof paidPlan) {
  return {
    id: "pm-1",
    userId: "user-1",
    planId: plan.id,
    plan,
    startDate: "2026-08-30T00:00:00.000Z",
    endDate: "2026-09-29T00:00:00.000Z",
    status: "ACTIVE",
    daysLeft: 30,
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  repo.getActiveMembership.mockResolvedValue(null);
  repo.findByPaymentReference.mockResolvedValue(null);
  repo.findOpenSubscriptionForUser.mockResolvedValue(null);
  repo.findByRazorpaySubscriptionId.mockResolvedValue(null);
  billing.createInvoice.mockResolvedValue({ id: "inv-1", confirmationSmsSentAt: null });
  billing.createRecurringPartnerInvoice.mockResolvedValue({ id: "inv-recurring-1" });
  webhookRepo.tryClaimEvent.mockResolvedValue(true);
  razorpay.isConfigured.mockReturnValue(true);
  razorpay.listSubscriptionInvoices.mockResolvedValue([]);
});

describe("PartnerMembershipService.purchaseMembership (ADR-069/070)", () => {
  it("activates a paid membership, writes a SERVICE_PROVIDER invoice snapshot, and never sends the Rider SMS", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));

    const result = await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    expect(result).toEqual({ ok: true, membership: membershipOn(paidPlan) });
    expect(billing.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: "SERVICE_PROVIDER",
        partnerMembershipId: "pm-1",
        planName: "Service Provider Membership",
        amount: 99,
        durationDays: 30,
        razorpayPaymentId: "pay_x",
      }),
    );
    expect(SMSService.sendMembershipSubscribed).not.toHaveBeenCalled();
    expect(SMSService.sendPartnerMembershipSubscribed).toHaveBeenCalledWith(
      "+919000000000",
      "Ravi Kumar",
      new Date(membershipOn(paidPlan).endDate),
    );
  });

  it("logs (not throws) and never sends the Rider template when the SP confirmation comes back unconfigured", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    expect(result.ok).toBe(true);
    expect(billing.markConfirmationSmsSent).not.toHaveBeenCalled();
    expect(SMSService.sendMembershipSubscribed).not.toHaveBeenCalled();
    // "unconfigured" is already logged by SMSService itself — purchaseMembership must not add a
    // second, noisier error on every single purchase until the operator configures a template.
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("free-tier activation still records a ₹0 invoice (uniform history), no payment refs", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(freePlan));

    const result = await PartnerMembershipService.purchaseMembership("user-1", "sp-free");
    await flush();

    expect(result.ok).toBe(true);
    expect(billing.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 0, paymentId: null, razorpayPaymentId: null, razorpayOrderId: null }),
    );
  });

  it("stamps confirmationSmsSentAt once the SP confirmation SMS is accepted", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));
    (SMSService.sendPartnerMembershipSubscribed as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      provider: "msg91",
      detail: "req-123",
    });

    await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    expect(billing.markConfirmationSmsSent).toHaveBeenCalledWith("inv-1");
  });

  it("logs structured MEMBERSHIP_SMS_* lines for the SP path with a masked phone — never the raw number (ADR-086)", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));
    (SMSService.sendPartnerMembershipSubscribed as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      provider: "msg91",
      detail: "req-sp-1",
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    const lines = log.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.startsWith("MEMBERSHIP_SMS_DISPATCH_START") && l.includes("accountType=SERVICE_PROVIDER"))).toBe(true);
    expect(lines.some((l) => l.startsWith("MEMBERSHIP_SMS_GATEWAY_ACCEPTED") && l.includes("msg91ReqId=req-sp-1"))).toBe(true);
    expect(lines.some((l) => l.includes("9000000000"))).toBe(false);
    expect(lines.some((l) => /phone=\+\*+0000/.test(l))).toBe(true);
    log.mockRestore();
  });

  it("logs MEMBERSHIP_SMS_UNCONFIGURED (not an error) for the SP path when unconfigured", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    // Default mock already resolves { ok: false, provider: "unconfigured" }.
    await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    expect(log.mock.calls.some((c) => String(c[0]).startsWith("MEMBERSHIP_SMS_UNCONFIGURED") && String(c[0]).includes("accountType=SERVICE_PROVIDER"))).toBe(true);
    expect(err).not.toHaveBeenCalled();
    log.mockRestore();
    err.mockRestore();
  });

  it("does not re-send the SP confirmation SMS if the invoice already has confirmationSmsSentAt", async () => {
    repo.createMembership.mockResolvedValueOnce(membershipOn(paidPlan));
    billing.createInvoice.mockResolvedValueOnce({ id: "inv-1", confirmationSmsSentAt: "2026-08-30T10:00:00.000Z" });

    await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", "pay_x", "order_x");
    await flush();

    expect(SMSService.sendPartnerMembershipSubscribed).not.toHaveBeenCalled();
  });

  it("replay returns the existing membership with no second invoice", async () => {
    repo.findByPaymentReference.mockResolvedValueOnce(membershipOn(paidPlan));

    const result = await PartnerMembershipService.purchaseMembership("user-1", "sp-plan", undefined, "order_x");

    expect(result).toEqual({ ok: true, membership: membershipOn(paidPlan) });
    expect(repo.createMembership).not.toHaveBeenCalled();
    expect(billing.createInvoice).not.toHaveBeenCalled();
  });

  it("rejects ALREADY_ACTIVE (covers the free-tier double-activate) with no invoice", async () => {
    repo.getActiveMembership.mockResolvedValueOnce(membershipOn(paidPlan));

    const result = await PartnerMembershipService.purchaseMembership("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "ALREADY_ACTIVE" });
    expect(repo.createMembership).not.toHaveBeenCalled();
    expect(billing.createInvoice).not.toHaveBeenCalled();
  });
});

function subscriptionMembershipOn(plan: typeof paidPlan, overrides: Partial<ReturnType<typeof subscriptionMembershipOnBase>> = {}) {
  return { ...subscriptionMembershipOnBase(plan), ...overrides };
}

function subscriptionMembershipOnBase(plan: typeof paidPlan) {
  return {
    ...membershipOn(plan),
    startDate: "2026-10-18T00:00:00.000Z",
    endDate: "2026-10-18T00:00:00.000Z",
    razorpaySubscriptionId: "sub_abc123",
    razorpayPlanId: "plan_xyz789",
    subscriptionStatus: "created",
    currentPeriodStart: null as string | null,
    currentPeriodEnd: null as string | null,
    cancelledAt: null as string | null,
    lastPaymentId: null as string | null,
  };
}

describe("PartnerMembershipService.startSubscription (recurring)", () => {
  it("creates a Razorpay Subscription and a placeholder PartnerMembership row, never activating it", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_abc123",
      status: "created",
      shortUrl: "https://rzp.io/i/abc123",
    });
    const created = subscriptionMembershipOn(paidPlan);
    repo.createSubscriptionMembership.mockResolvedValueOnce(created);
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "plan_xyz789");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({
      ok: true,
      membership: created,
      subscription: { id: "sub_abc123", status: "created", shortUrl: "https://rzp.io/i/abc123" },
    });
    expect(razorpay.createSubscription).toHaveBeenCalledWith("plan_xyz789", expect.objectContaining({ userId: "user-1", planId: "sp-plan" }));
    expect(repo.createSubscriptionMembership).toHaveBeenCalledWith("user-1", "sp-plan", "sub_abc123", "plan_xyz789", "created");
    // The row it stores reports endDate === startDate: NOT yet eligible per the existing
    // `status === ACTIVE && endDate >= now()` check anywhere that condition is evaluated.
    expect(created.startDate).toBe(created.endDate);
  });

  it("rejects PLAN_NOT_FOUND for an inactive/missing plan", async () => {
    repo.findPlanById.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.startSubscription("user-1", "missing-plan");

    expect(result).toEqual({ ok: false, reason: "PLAN_NOT_FOUND" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects ALREADY_ACTIVE when a one-time/free membership is already active", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.getActiveMembership.mockResolvedValueOnce(membershipOn(paidPlan));

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "ALREADY_ACTIVE" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_ALREADY_EXISTS when Razorpay's own live state shows the open subscription was actually charged (paidCount > 0) — never creates a second one", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan, { subscriptionStatus: "active" }));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 1 });

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
    expect(repo.createSubscriptionMembership).not.toHaveBeenCalled();
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_ALREADY_EXISTS when Razorpay reports paidCount > 0 even though the LOCAL row still looks unactivated — Razorpay's live state wins over a stale/lagging webhook, never silently replaced", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    // Local row still shows "created"/startDate===endDate — as if the `subscription.charged`
    // webhook simply hasn't landed yet when the SP retries. Must not be treated as stale.
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 1 });

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("a genuinely STALE open subscription (Razorpay confirms paidCount 0, status still non-terminal) is cancelled and replaced — the SP could otherwise never retry after one failed/abandoned mandate authorization", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "created", paidCount: 0 });
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_abc123", status: "cancelled", shortUrl: "" });
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_new456",
      status: "created",
      shortUrl: "https://rzp.io/i/new456",
    });
    const created = subscriptionMembershipOn(paidPlan, { id: "pm-2", razorpaySubscriptionId: "sub_new456" });
    repo.createSubscriptionMembership.mockResolvedValueOnce(created);
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "plan_xyz789");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(razorpay.fetchSubscription).toHaveBeenCalledWith("sub_abc123");
    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_abc123", false);
    expect(razorpay.createSubscription).toHaveBeenCalledWith("plan_xyz789", expect.objectContaining({ userId: "user-1" }));
    expect(result).toEqual({
      ok: true,
      membership: created,
      subscription: { id: "sub_new456", status: "created", shortUrl: "https://rzp.io/i/new456" },
    });
  });

  it("skips the redundant cancel call when Razorpay already reports the stale subscription as terminal (cancelled/completed/expired)", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "expired", paidCount: 0 });
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_new456",
      status: "created",
      shortUrl: "https://rzp.io/i/new456",
    });
    repo.createSubscriptionMembership.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan, { id: "pm-2" }));
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "plan_xyz789");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("still creates a fresh subscription even if cancelling the stale one fails on Razorpay's side — an orphaned unauthorized subscription never charges anything regardless", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "created", paidCount: 0 });
    razorpay.cancelSubscription.mockResolvedValueOnce(null);
    razorpay.createSubscription.mockResolvedValueOnce({
      id: "sub_new456",
      status: "created",
      shortUrl: "https://rzp.io/i/new456",
    });
    repo.createSubscriptionMembership.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan, { id: "pm-2" }));
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "plan_xyz789");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result.ok).toBe(true);
    expect(razorpay.createSubscription).toHaveBeenCalled();
  });

  it("fails SAFE (SUBSCRIPTION_ALREADY_EXISTS, no cancel/create) when Razorpay's live state can't be verified at all — never guesses toward cancelling", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects NOT_CONFIGURED when RAZORPAY_SP_MEMBERSHIP_PLAN_ID is unset — never hardcodes a plan id", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "NOT_CONFIGURED" });
    expect(razorpay.createSubscription).not.toHaveBeenCalled();
  });

  it("rejects SUBSCRIPTION_CREATE_FAILED when Razorpay itself fails, without creating a membership row", async () => {
    repo.findPlanById.mockResolvedValueOnce(paidPlan);
    razorpay.createSubscription.mockResolvedValueOnce(null);
    vi.stubEnv("RAZORPAY_SP_MEMBERSHIP_PLAN_ID", "plan_xyz789");

    const result = await PartnerMembershipService.startSubscription("user-1", "sp-plan");

    expect(result).toEqual({ ok: false, reason: "SUBSCRIPTION_CREATE_FAILED" });
    expect(repo.createSubscriptionMembership).not.toHaveBeenCalled();
  });
});

describe("PartnerMembershipService.cancelSubscription (recurring)", () => {
  it("cancels at cycle end, never revoking the already-paid-for current period", async () => {
    const open = subscriptionMembershipOn(paidPlan, { subscriptionStatus: "active" });
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(open);
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_abc123", status: "active", shortUrl: "" });
    const updated = { ...open, subscriptionStatus: "active", cancelledAt: "2026-10-18T12:00:00.000Z" };
    repo.updateSubscriptionStatus.mockResolvedValueOnce(updated);

    const result = await PartnerMembershipService.cancelSubscription("user-1");

    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_abc123", true); // cancelAtCycleEnd
    expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("pm-1", "active", { cancelledAt: expect.any(Date) });
    expect(result).toEqual({ ok: true, membership: updated });
  });

  it("rejects NO_ACTIVE_SUBSCRIPTION when the user has no open subscription", async () => {
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.cancelSubscription("user-1");

    expect(result).toEqual({ ok: false, reason: "NO_ACTIVE_SUBSCRIPTION" });
    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects CANCEL_FAILED when Razorpay's own cancellation call fails, without touching the DB row", async () => {
    repo.findOpenSubscriptionForUser.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.cancelSubscription.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.cancelSubscription("user-1");

    expect(result).toEqual({ ok: false, reason: "CANCEL_FAILED" });
    expect(repo.updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});

describe("PartnerMembershipService.recordRecurringCharge (webhook: subscription.charged / activated)", () => {
  it("extends endDate to currentPeriodEnd, keeps status ACTIVE, stamps lastPaymentId, and creates a NEW invoice", async () => {
    const existing = subscriptionMembershipOn(paidPlan, { subscriptionStatus: "active" });
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
    const periodEnd = new Date("2026-11-18T00:00:00.000Z");
    const periodStart = new Date("2026-10-18T00:00:00.000Z");
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

    const result = await PartnerMembershipService.recordRecurringCharge("sub_abc123", {
      subscriptionStatus: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      razorpayPaymentId: "pay_recurring_1",
      amount: 99,
    });

    // This is the exact write that makes `findEligiblePartnersNearPoint`'s/`getActiveMembership`'s
    // unchanged `status === "ACTIVE" && endDate >= now()` condition true again — no SOS code
    // touched, verified here at the write.
    expect(repo.recordSubscriptionCharge).toHaveBeenCalledWith("pm-1", {
      subscriptionStatus: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      lastPaymentId: "pay_recurring_1",
    });
    expect(result).toEqual(afterCharge);
    expect(result!.status).toBe("ACTIVE");
    expect(new Date(result!.endDate).getTime()).toBeGreaterThan(Date.now());

    expect(billing.createRecurringPartnerInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: "SERVICE_PROVIDER",
        partnerMembershipId: "pm-1",
        amount: 99,
        razorpayPaymentId: "pay_recurring_1",
        membershipEndDate: periodEnd,
      }),
    );
  });

  it("creating a second month's invoice never touches the first month's invoice — each charge gets its own", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(paidPlan));
    repo.recordSubscriptionCharge.mockResolvedValue(subscriptionMembershipOn(paidPlan));

    await PartnerMembershipService.recordRecurringCharge("sub_abc123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2026-10-18T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-11-18T00:00:00.000Z"),
      razorpayPaymentId: "pay_month_1",
      amount: 99,
    });
    await PartnerMembershipService.recordRecurringCharge("sub_abc123", {
      subscriptionStatus: "active",
      currentPeriodStart: new Date("2026-11-18T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-12-18T00:00:00.000Z"),
      razorpayPaymentId: "pay_month_2",
      amount: 99,
    });

    expect(billing.createRecurringPartnerInvoice).toHaveBeenCalledTimes(2);
    const [[firstCall], [secondCall]] = billing.createRecurringPartnerInvoice.mock.calls;
    expect(firstCall.razorpayPaymentId).toBe("pay_month_1");
    expect(secondCall.razorpayPaymentId).toBe("pay_month_2");
    expect(firstCall.razorpayPaymentId).not.toBe(secondCall.razorpayPaymentId);
  });

  it("logs and returns null for an unknown subscription id, without throwing (webhook must still ack)", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await PartnerMembershipService.recordRecurringCharge("sub_unknown", {
      subscriptionStatus: "active",
      currentPeriodStart: null,
      currentPeriodEnd: new Date(),
      razorpayPaymentId: "pay_x",
      amount: 99,
    });

    expect(result).toBeNull();
    expect(repo.recordSubscriptionCharge).not.toHaveBeenCalled();
    expect(billing.createRecurringPartnerInvoice).not.toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("PartnerMembershipService.recordSubscriptionStatusChange (webhook: pending/halted/cancelled/completed)", () => {
  it.each(["pending", "halted", "cancelled", "completed"])(
    "updates subscriptionStatus for '%s' without touching status/endDate",
    async (subscriptionStatus) => {
      const existing = subscriptionMembershipOn(paidPlan, { subscriptionStatus: "active", status: "ACTIVE", endDate: "2026-11-18T00:00:00.000Z" });
      repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
      const updated = { ...existing, subscriptionStatus };
      repo.updateSubscriptionStatus.mockResolvedValueOnce(updated);

      const result = await PartnerMembershipService.recordSubscriptionStatusChange("sub_abc123", subscriptionStatus);

      expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("pm-1", subscriptionStatus, {});
      expect(result).toEqual(updated);
      // status/endDate are not part of the update payload at all — confirmed above.
    },
  );

  it("returns null for an unknown subscription id without throwing", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.recordSubscriptionStatusChange("sub_unknown", "halted");

    expect(result).toBeNull();
    expect(repo.updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});

describe("PartnerMembershipService.claimWebhookEvent (idempotency)", () => {
  it("returns true the first time an event id is seen", async () => {
    webhookRepo.tryClaimEvent.mockResolvedValueOnce(true);

    const result = await PartnerMembershipService.claimWebhookEvent("evt_1", "subscription.charged");

    expect(result).toBe(true);
    expect(webhookRepo.tryClaimEvent).toHaveBeenCalledWith("evt_1", "subscription.charged");
  });

  it("returns false and logs on a duplicate delivery of the same event id — never processed twice", async () => {
    webhookRepo.tryClaimEvent.mockResolvedValueOnce(false);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await PartnerMembershipService.claimWebhookEvent("evt_1", "subscription.charged");

    expect(result).toBe(false);
    expect(log.mock.calls.some((c) => String(c[0]).includes("SUBSCRIPTION_WEBHOOK_DUPLICATE"))).toBe(true);
    log.mockRestore();
  });
});

describe("PartnerMembershipService.reconcileSubscription (admin-triggered, webhook-missed recovery)", () => {
  it("rejects NOT_FOUND for an unknown subscription id", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.reconcileSubscription("sub_unknown");

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(razorpay.fetchSubscription).not.toHaveBeenCalled();
  });

  it("rejects COULD_NOT_VERIFY when Razorpay's live state can't be fetched — never guesses toward charging/activating anything", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce(null);

    const result = await PartnerMembershipService.reconcileSubscription("sub_abc123");

    expect(result).toEqual({ ok: false, reason: "COULD_NOT_VERIFY" });
    expect(razorpay.listSubscriptionInvoices).not.toHaveBeenCalled();
  });

  it("replays every paid invoice Razorpay has, oldest first, through the exact same recordRecurringCharge path the webhook itself uses", async () => {
    repo.findByRazorpaySubscriptionId.mockResolvedValue(subscriptionMembershipOn(paidPlan));
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 2 });
    razorpay.listSubscriptionInvoices.mockResolvedValueOnce([
      {
        razorpayPaymentId: "pay_1",
        amount: 99,
        billingStart: new Date("2026-09-25T00:00:00.000Z"),
        billingEnd: new Date("2026-10-25T00:00:00.000Z"),
        paidAt: new Date("2026-09-25T00:05:00.000Z"),
      },
      {
        razorpayPaymentId: "pay_2",
        amount: 99,
        billingStart: new Date("2026-10-25T00:00:00.000Z"),
        billingEnd: new Date("2026-11-25T00:00:00.000Z"),
        paidAt: new Date("2026-10-25T00:05:00.000Z"),
      },
    ]);
    repo.recordSubscriptionCharge
      .mockResolvedValueOnce({ ...subscriptionMembershipOn(paidPlan), endDate: "2026-10-25T00:00:00.000Z" })
      .mockResolvedValueOnce({ ...subscriptionMembershipOn(paidPlan), endDate: "2026-11-25T00:00:00.000Z" });

    const result = await PartnerMembershipService.reconcileSubscription("sub_abc123");

    expect(repo.recordSubscriptionCharge).toHaveBeenNthCalledWith(
      1,
      "pm-1",
      expect.objectContaining({ lastPaymentId: "pay_1", currentPeriodEnd: new Date("2026-10-25T00:00:00.000Z") }),
    );
    expect(repo.recordSubscriptionCharge).toHaveBeenNthCalledWith(
      2,
      "pm-1",
      expect.objectContaining({ lastPaymentId: "pay_2", currentPeriodEnd: new Date("2026-11-25T00:00:00.000Z") }),
    );
    expect(billing.createRecurringPartnerInvoice).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ razorpayPaymentId: "pay_1", paidAt: new Date("2026-09-25T00:05:00.000Z") }),
    );
    expect(billing.createRecurringPartnerInvoice).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ razorpayPaymentId: "pay_2", paidAt: new Date("2026-10-25T00:05:00.000Z") }),
    );
    expect(result).toEqual({
      ok: true,
      membership: expect.objectContaining({ endDate: "2026-11-25T00:00:00.000Z" }),
      invoicesFound: 2,
    });
  });

  it("is a safe no-op when no paid invoices exist, but still syncs the local status to Razorpay's own live status (e.g. a cancellation whose webhook also never arrived)", async () => {
    const existing = subscriptionMembershipOn(paidPlan, { subscriptionStatus: "created" });
    repo.findByRazorpaySubscriptionId.mockResolvedValueOnce(existing);
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "cancelled", paidCount: 0 });
    razorpay.listSubscriptionInvoices.mockResolvedValueOnce([]);
    const synced = { ...existing, subscriptionStatus: "cancelled" };
    repo.updateSubscriptionStatus.mockResolvedValueOnce(synced);

    const result = await PartnerMembershipService.reconcileSubscription("sub_abc123");

    expect(repo.updateSubscriptionStatus).toHaveBeenCalledWith("pm-1", "cancelled", {});
    expect(repo.recordSubscriptionCharge).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, membership: synced, invoicesFound: 0 });
  });
});
