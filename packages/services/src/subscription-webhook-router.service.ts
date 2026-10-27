import { membershipRepository, partnerMembershipRepository } from "@bikie/database";

export type SubscriptionAccountType = "RIDER" | "SERVICE_PROVIDER";

/**
 * Resolves which account type owns a given Razorpay Subscription id — Rider (`UserMembership`,
 * ₹149/year) or Service Provider (`PartnerMembership`, ₹99/month) — so `POST /api/webhooks/
 * razorpay` and the admin reconcile/cancel tools can delegate to the correct service without
 * guessing or double-processing an event against both. The two tables' `razorpaySubscriptionId`
 * columns are independently unique, so a given id can belong to at most one of them.
 */
export const SubscriptionWebhookRouter = {
  async resolveAccountType(razorpaySubscriptionId: string): Promise<SubscriptionAccountType | null> {
    const [partnerMembership, userMembership] = await Promise.all([
      partnerMembershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId),
      membershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId),
    ]);
    if (partnerMembership) return "SERVICE_PROVIDER";
    if (userMembership) return "RIDER";
    return null;
  },
};
