import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  membershipRepository: {
    createMembership: vi.fn(),
  },
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("./sms.service", () => ({
  SMSService: { sendMembershipSubscribed: vi.fn(async () => ({ ok: true, provider: "msg91" })) },
}));

import { membershipRepository, userRepository } from "@bikie/database";
import { SMSService } from "./sms.service";
import { MembershipService } from "./membership.service";

const mockedMembershipRepo = membershipRepository as unknown as { createMembership: ReturnType<typeof vi.fn> };
const mockedUserRepo = userRepository as unknown as { findById: ReturnType<typeof vi.fn> };

const sampleMembership = {
  id: "membership-1",
  userId: "user-1",
  planId: "plan-1",
  plan: { id: "plan-1", name: "Membership", description: "", price: 99, durationDays: 365, benefits: [], isActive: true },
  startDate: "2026-08-19T00:00:00.000Z",
  endDate: "2027-08-19T00:00:00.000Z",
  status: "ACTIVE",
  daysLeft: 365,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("MembershipService.purchaseMembership (ADR-058)", () => {
  it("sends the BIKIE_Sub SMS confirmation with the user's phone, name, and endDate after a successful purchase", async () => {
    mockedMembershipRepo.createMembership.mockResolvedValueOnce(sampleMembership);
    mockedUserRepo.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya Verma", phoneNumber: "+919876543210" });

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "payment-1");

    expect(result).toEqual(sampleMembership);
    expect(SMSService.sendMembershipSubscribed).toHaveBeenCalledWith(
      "+919876543210",
      "Priya Verma",
      new Date(sampleMembership.endDate),
    );
  });

  it("does not attempt to send SMS when the user has no phoneNumber on file", async () => {
    mockedMembershipRepo.createMembership.mockResolvedValueOnce(sampleMembership);
    mockedUserRepo.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya Verma", phoneNumber: null });

    await MembershipService.purchaseMembership("user-1", "plan-1", "payment-1");

    expect(SMSService.sendMembershipSubscribed).not.toHaveBeenCalled();
  });

  it("does not fail the purchase when the SMS confirmation itself throws", async () => {
    mockedMembershipRepo.createMembership.mockResolvedValueOnce(sampleMembership);
    mockedUserRepo.findById.mockResolvedValueOnce({ id: "user-1", name: "Priya Verma", phoneNumber: "+919876543210" });
    (SMSService.sendMembershipSubscribed as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("MSG91 down"));

    const result = await MembershipService.purchaseMembership("user-1", "plan-1", "payment-1");

    expect(result).toEqual(sampleMembership);
  });
});
