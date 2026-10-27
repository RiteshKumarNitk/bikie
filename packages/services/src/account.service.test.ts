import { describe, expect, it, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({
  membershipFindOpen: vi.fn(),
  partnerFindOpen: vi.fn(),
}));
vi.mock("@bikie/database", () => ({
  membershipRepository: { findOpenSubscriptionForUser: repo.membershipFindOpen },
  partnerMembershipRepository: { findOpenSubscriptionForUser: repo.partnerFindOpen },
}));

const razorpay = vi.hoisted(() => ({ fetchSubscription: vi.fn() }));
vi.mock("./razorpay.service", () => ({ RazorpayService: { fetchSubscription: razorpay.fetchSubscription } }));

const admin = vi.hoisted(() => ({ deleteUser: vi.fn() }));
vi.mock("./admin.service", () => ({ AdminService: { deleteUser: admin.deleteUser } }));

import { AccountService } from "./account.service";

beforeEach(() => {
  vi.resetAllMocks();
  repo.membershipFindOpen.mockResolvedValue(null);
  repo.partnerFindOpen.mockResolvedValue(null);
});

describe("AccountService.deleteOwnAccount", () => {
  it("deletes immediately when neither account type has any open subscription", async () => {
    admin.deleteUser.mockResolvedValueOnce({ ok: true, anonymized: false });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: true, anonymized: false });
    expect(razorpay.fetchSubscription).not.toHaveBeenCalled();
    expect(admin.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("deletes without a live Razorpay check when the subscription is already cancelled locally (cancelledAt set)", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_1", cancelledAt: "2026-10-01T00:00:00.000Z" });
    admin.deleteUser.mockResolvedValueOnce({ ok: true, anonymized: false });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: true, anonymized: false });
    expect(razorpay.fetchSubscription).not.toHaveBeenCalled();
  });

  it("blocks deletion when Razorpay confirms the Rider subscription is still genuinely active", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_1", cancelledAt: null });
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 1 });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: false, reason: "ACTIVE_SUBSCRIPTION" });
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it("blocks deletion when Razorpay confirms the Service Provider subscription is still genuinely active", async () => {
    repo.partnerFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_sp", cancelledAt: null });
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "active", paidCount: 3 });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: false, reason: "ACTIVE_SUBSCRIPTION" });
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it("allows deletion when the local row is still open but Razorpay's live status is already terminal", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_1", cancelledAt: null });
    razorpay.fetchSubscription.mockResolvedValueOnce({ status: "cancelled", paidCount: 2 });
    admin.deleteUser.mockResolvedValueOnce({ ok: true, anonymized: true });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: true, anonymized: true });
  });

  it("fails toward blocking deletion when Razorpay's live state cannot be verified", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_1", cancelledAt: null });
    razorpay.fetchSubscription.mockResolvedValueOnce(null);

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: false, reason: "COULD_NOT_VERIFY_SUBSCRIPTION" });
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it("passes through NOT_FOUND/ADMIN_PROTECTED from the underlying deletion unchanged", async () => {
    admin.deleteUser.mockResolvedValueOnce({ ok: false, reason: "ADMIN_PROTECTED" });

    const result = await AccountService.deleteOwnAccount("user-1");

    expect(result).toEqual({ ok: false, reason: "ADMIN_PROTECTED" });
  });
});
