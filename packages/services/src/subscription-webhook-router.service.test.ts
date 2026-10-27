import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  partnerMembershipRepository: { findByRazorpaySubscriptionId: vi.fn(async () => null) },
  membershipRepository: { findByRazorpaySubscriptionId: vi.fn(async () => null) },
}));

import { membershipRepository, partnerMembershipRepository } from "@bikie/database";
import { SubscriptionWebhookRouter } from "./subscription-webhook-router.service";

const partner = partnerMembershipRepository as unknown as { findByRazorpaySubscriptionId: ReturnType<typeof vi.fn> };
const rider = membershipRepository as unknown as { findByRazorpaySubscriptionId: ReturnType<typeof vi.fn> };

afterEach(() => vi.resetAllMocks());

describe("SubscriptionWebhookRouter.resolveAccountType", () => {
  it("returns SERVICE_PROVIDER when the subscription id belongs to a PartnerMembership row", async () => {
    partner.findByRazorpaySubscriptionId.mockResolvedValueOnce({ id: "pm-1" });
    rider.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await SubscriptionWebhookRouter.resolveAccountType("sub_abc123");

    expect(result).toBe("SERVICE_PROVIDER");
  });

  it("returns RIDER when the subscription id belongs to a UserMembership row", async () => {
    partner.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);
    rider.findByRazorpaySubscriptionId.mockResolvedValueOnce({ id: "um-1" });

    const result = await SubscriptionWebhookRouter.resolveAccountType("sub_rider1");

    expect(result).toBe("RIDER");
  });

  it("returns null when neither table has a matching row", async () => {
    partner.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);
    rider.findByRazorpaySubscriptionId.mockResolvedValueOnce(null);

    const result = await SubscriptionWebhookRouter.resolveAccountType("sub_unknown");

    expect(result).toBeNull();
  });

  it("prefers SERVICE_PROVIDER if (impossibly, given both columns are independently unique) both somehow matched", async () => {
    partner.findByRazorpaySubscriptionId.mockResolvedValueOnce({ id: "pm-1" });
    rider.findByRazorpaySubscriptionId.mockResolvedValueOnce({ id: "um-1" });

    const result = await SubscriptionWebhookRouter.resolveAccountType("sub_abc123");

    expect(result).toBe("SERVICE_PROVIDER");
  });
});
