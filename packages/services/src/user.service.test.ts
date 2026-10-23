import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  userRepository: {
    findById: vi.fn(),
    updateName: vi.fn(),
    setAccountType: vi.fn(),
  },
}));

import { userRepository } from "@bikie/database";
import { UserService } from "./user.service";

const repo = userRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

afterEach(() => {
  vi.clearAllMocks();
});

const brandNewUser = (overrides: Partial<{ name: string; phoneNumber: string; createdAt: Date }> = {}) => ({
  id: "u1",
  name: overrides.name ?? "+911234567890",
  phoneNumber: overrides.phoneNumber ?? "+911234567890",
  role: "RENTER",
  accountType: "RIDER",
  createdAt: overrides.createdAt ?? new Date(),
});

describe("UserService.completePhoneSignup — account-type correctness at registration", () => {
  it("applies the chosen accountType for a brand-new account (placeholder name === phone)", async () => {
    repo.findById.mockResolvedValue(brandNewUser());

    const result = await UserService.completePhoneSignup("u1", { accountType: "SERVICE_PROVIDER" });

    expect(result).toEqual({ ok: true, accountTypeApplied: true });
    expect(repo.setAccountType).toHaveBeenCalledWith("u1", "SERVICE_PROVIDER");
  });

  it("applies RIDER just as reliably as SERVICE_PROVIDER — no silent default/swap", async () => {
    repo.findById.mockResolvedValue(brandNewUser());

    await UserService.completePhoneSignup("u1", { accountType: "RIDER" });

    expect(repo.setAccountType).toHaveBeenCalledWith("u1", "RIDER");
  });

  it("still applies accountType inside the signup window even once a real name was set this same call", async () => {
    // Fetched row still has the placeholder name (read BEFORE this call's own `updateName` runs,
    // since `isPlaceholderName` must reflect state going into this specific signup completion).
    repo.findById.mockResolvedValue(brandNewUser());

    const result = await UserService.completePhoneSignup("u1", { name: "Real Name", accountType: "SERVICE_PROVIDER" });

    expect(repo.updateName).toHaveBeenCalledWith("u1", "Real Name");
    expect(result).toEqual({ ok: true, accountTypeApplied: true });
  });

  it("refuses to change accountType on an established account (real name, outside the window) — never a self-service switch", async () => {
    repo.findById.mockResolvedValue(
      brandNewUser({ name: "Established User", createdAt: new Date(Date.now() - 60 * 60 * 1000) }),
    );

    const result = await UserService.completePhoneSignup("u1", { accountType: "SERVICE_PROVIDER" });

    expect(result).toEqual({ ok: true, accountTypeApplied: false });
    expect(repo.setAccountType).not.toHaveBeenCalled();
  });

  it("a brand-new account still inside the signup window (real name already set, e.g. a retried request) still applies it", async () => {
    repo.findById.mockResolvedValue(brandNewUser({ name: "Already Named" }));

    const result = await UserService.completePhoneSignup("u1", { accountType: "SERVICE_PROVIDER" });

    expect(result).toEqual({ ok: true, accountTypeApplied: true });
  });

  it("no accountType in the request never touches it, regardless of window", async () => {
    repo.findById.mockResolvedValue(brandNewUser());

    const result = await UserService.completePhoneSignup("u1", { name: "Just A Name" });

    expect(result).toEqual({ ok: true, accountTypeApplied: false });
    expect(repo.setAccountType).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a user id that doesn't exist (e.g. raced with a deletion)", async () => {
    repo.findById.mockResolvedValue(null);

    const result = await UserService.completePhoneSignup("ghost", { accountType: "SERVICE_PROVIDER" });

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(repo.setAccountType).not.toHaveBeenCalled();
  });
});
