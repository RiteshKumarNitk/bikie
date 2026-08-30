import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  membershipRepository: {
    createMembership: vi.fn(),
    getActiveMembership: vi.fn(async () => null),
    findByPaymentReference: vi.fn(async () => null),
  },
  billingRepository: {
    createInvoice: vi.fn(async () => ({ id: "inv-1", confirmationSmsSentAt: null })),
    markConfirmationSmsSent: vi.fn(async () => undefined),
  },
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("./sms.service", () => ({
  SMSService: { sendMembershipSubscribed: vi.fn(async () => ({ ok: true, provider: "msg91" })) },
}));

import { membershipRepository, billingRepository, userRepository } from "@bikie/database";
import { SMSService } from "./sms.service";
import { MembershipService } from "./membership.service";

const repo = membershipRepository as unknown as {
  createMembership: ReturnType<typeof vi.fn>;
  getActiveMembership: ReturnType<typeof vi.fn>;
  findByPaymentReference: ReturnType<typeof vi.fn>;
};
const billing = billingRepository as unknown as {
  createInvoice: ReturnType<typeof vi.fn>;
  markConfirmationSmsSent: ReturnType<typeof vi.fn>;
};
const users = userRepository as unknown as { findById: ReturnType<typeof vi.fn> };
const sms = SMSService.sendMembershipSubscribed as ReturnType<typeof vi.fn>;

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

/** Wait for the fire-and-forget SMS → markConfirmationSmsSent chain to settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.clearAllMocks();
  repo.getActiveMembership.mockResolvedValue(null);
  repo.findByPaymentReference.mockResolvedValue(null);
  billing.createInvoice.mockResolvedValue({ id: "inv-1", confirmationSmsSentAt: null });
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
