import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  partnerMembershipRepository: {
    createMembership: vi.fn(),
    getActiveMembership: vi.fn(async () => null),
    findByPaymentReference: vi.fn(async () => null),
  },
  billingRepository: {
    createInvoice: vi.fn(async () => ({ id: "inv-1", confirmationSmsSentAt: null })),
    markConfirmationSmsSent: vi.fn(async () => undefined),
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

import { partnerMembershipRepository, billingRepository } from "@bikie/database";
import { SMSService } from "./sms.service";
import { PartnerMembershipService } from "./partner-membership.service";

const repo = partnerMembershipRepository as unknown as {
  createMembership: ReturnType<typeof vi.fn>;
  getActiveMembership: ReturnType<typeof vi.fn>;
  findByPaymentReference: ReturnType<typeof vi.fn>;
};
const billing = billingRepository as unknown as {
  createInvoice: ReturnType<typeof vi.fn>;
  markConfirmationSmsSent: ReturnType<typeof vi.fn>;
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
  repo.getActiveMembership.mockResolvedValue(null);
  repo.findByPaymentReference.mockResolvedValue(null);
  billing.createInvoice.mockResolvedValue({ id: "inv-1", confirmationSmsSentAt: null });
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
