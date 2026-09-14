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
  MSG91_SMS_TEMPLATE_ENV: { MEMBERSHIP_SUBSCRIBED: "MSG91_MEMBERSHIP_SUB_TEMPLATE_ID" },
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
