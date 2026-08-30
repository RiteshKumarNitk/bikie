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
vi.mock("./sms.service", () => ({
  SMSService: { sendMembershipSubscribed: vi.fn() },
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
