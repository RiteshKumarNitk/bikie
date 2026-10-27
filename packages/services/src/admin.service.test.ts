import { describe, expect, it, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({
  membershipFindOpen: vi.fn(),
  partnerFindOpen: vi.fn(),
}));
vi.mock("@bikie/database", () => ({
  membershipRepository: { findOpenSubscriptionForUser: repo.membershipFindOpen },
  partnerMembershipRepository: { findOpenSubscriptionForUser: repo.partnerFindOpen },
}));

const razorpay = vi.hoisted(() => ({ cancelSubscription: vi.fn() }));
vi.mock("./razorpay.service", () => ({ RazorpayService: { cancelSubscription: razorpay.cancelSubscription } }));

const administration = vi.hoisted(() => ({ deleteUser: vi.fn() }));
vi.mock("./modules/administration/public", () => ({
  getAdministrationModule: () => ({ admin: { deleteUser: administration.deleteUser } }),
}));

import { AdminService } from "./admin.service";

beforeEach(() => {
  vi.resetAllMocks();
  repo.membershipFindOpen.mockResolvedValue(null);
  repo.partnerFindOpen.mockResolvedValue(null);
  administration.deleteUser.mockResolvedValue({ ok: true, anonymized: false });
});

describe("AdminService.deleteUser", () => {
  it("skips cancellation entirely when the user has no open subscription of either type", async () => {
    await AdminService.deleteUser("user-1");

    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
    expect(administration.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("cancels an open Rider subscription immediately (not cycle-end) before deleting", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_rider", cancelledAt: null });
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_rider", status: "cancelled", shortUrl: "" });

    await AdminService.deleteUser("user-1");

    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_rider", false);
    expect(administration.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("cancels an open Service Provider subscription too, independently of the Rider one", async () => {
    repo.partnerFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_sp", cancelledAt: null });
    razorpay.cancelSubscription.mockResolvedValueOnce({ id: "sub_sp", status: "cancelled", shortUrl: "" });

    await AdminService.deleteUser("user-1");

    expect(razorpay.cancelSubscription).toHaveBeenCalledWith("sub_sp", false);
  });

  it("skips a subscription whose cycle-end cancellation is already in flight (cancelledAt set) — nothing left to cancel", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_rider", cancelledAt: "2026-10-01T00:00:00.000Z" });

    await AdminService.deleteUser("user-1");

    expect(razorpay.cancelSubscription).not.toHaveBeenCalled();
  });

  it("never blocks the deletion when the Razorpay cancel call fails — logs and proceeds anyway", async () => {
    repo.membershipFindOpen.mockResolvedValueOnce({ razorpaySubscriptionId: "sub_rider", cancelledAt: null });
    razorpay.cancelSubscription.mockResolvedValueOnce(null);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await AdminService.deleteUser("user-1");

    expect(result).toEqual({ ok: true, anonymized: false });
    expect(administration.deleteUser).toHaveBeenCalledWith("user-1");
    err.mockRestore();
  });
});
