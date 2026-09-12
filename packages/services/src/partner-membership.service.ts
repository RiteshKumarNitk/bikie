import { billingRepository, partnerMembershipRepository, userRepository } from "@bikie/database";
import type { PartnerMembershipPlanDTO, PartnerMembershipDTO } from "@bikie/types";
import { isRealRazorpayPaymentId } from "./billing.internal";
import { SMSService } from "./sms.service";

/** ADR-069 — mirrors `MembershipService`'s `PurchaseMembershipResult`. */
export type PurchasePartnerMembershipResult =
  | { ok: true; membership: PartnerMembershipDTO }
  | { ok: false; reason: "ALREADY_ACTIVE" };

/** ADR-051 — mirrors `MembershipService`, entirely separate data. */
export const PartnerMembershipService = {
  async getPlans(): Promise<PartnerMembershipPlanDTO[]> {
    return partnerMembershipRepository.findAllActivePlans();
  },

  async getActiveMembership(userId: string): Promise<PartnerMembershipDTO | null> {
    return partnerMembershipRepository.getActiveMembership(userId);
  },

  async getPlanById(planId: string): Promise<PartnerMembershipPlanDTO | null> {
    return partnerMembershipRepository.findPlanById(planId);
  },

  async purchaseMembership(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string,
  ): Promise<PurchasePartnerMembershipResult> {
    // ADR-069 — idempotent replay (mirrors `MembershipService.purchaseMembership`).
    if (paymentId || razorpayOrderId) {
      const existing = await partnerMembershipRepository.findByPaymentReference({ paymentId, razorpayOrderId });
      if (existing) return { ok: true, membership: existing };
    }

    // ADR-069 — one active membership at a time (covers the free-tier path too: it calls this
    // with no payment reference, so a double "Activate" hits this check).
    const active = await partnerMembershipRepository.getActiveMembership(userId);
    if (active) return { ok: false, reason: "ALREADY_ACTIVE" };

    const membership = await partnerMembershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
    const user = await userRepository.findById(userId);

    // ADR-070 — persist the immutable receipt (snapshot from the row/plan just created;
    // idempotent per membership id + payment id). A free-tier activation (`amount` 0, no payment
    // reference) still gets an invoice so billing history is uniform across both account types.
    const invoice = await billingRepository.createInvoice({
      userId,
      accountType: "SERVICE_PROVIDER",
      partnerMembershipId: membership.id,
      planId: membership.plan.id,
      planName: membership.plan.name,
      amount: membership.plan.price,
      durationDays: membership.plan.durationDays,
      membershipStartDate: new Date(membership.startDate),
      membershipEndDate: new Date(membership.endDate),
      customerName: user?.name ?? "BIKIE Service Provider",
      customerPhone: user?.phoneNumber ?? null,
      paymentId: paymentId ?? null,
      razorpayPaymentId: isRealRazorpayPaymentId(paymentId) ? paymentId! : null,
      razorpayOrderId: razorpayOrderId ?? null,
      paidAt: new Date(),
    });

    // ADR-080 — Service Provider membership confirmation SMS: separate from the Rider "BIKIE_Sub"
    // template (annual-specific text, wrong for this monthly plan — see
    // `SMSService.sendPartnerMembershipSubscribed`'s doc comment). Mirrors the Rider flow exactly
    // otherwise: fire-and-forget, never fails/rolls back the purchase, deduped by the same
    // `confirmationSmsSentAt` guard. Refuses cleanly (logged, retryable) until the operator
    // registers a real SP DLT template and sets both its env vars — never sends the Rider
    // template just because a payment succeeded.
    if (user?.phoneNumber && !invoice.confirmationSmsSentAt) {
      SMSService.sendPartnerMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate))
        .then((res) => {
          if (res && res.ok === false) {
            if (res.provider !== "unconfigured") {
              console.error("[PartnerMembershipService][purchaseMembership] SMS confirmation not accepted", res.error);
            }
            return;
          }
          console.log(
            `[PartnerMembershipService][purchaseMembership] partner membership SMS accepted for invoice ${invoice.id}` +
              `${res?.detail ? ` (MSG91 reqId=${res.detail})` : ""}`,
          );
          return billingRepository.markConfirmationSmsSent(invoice.id);
        })
        .catch((err) =>
          console.error("[PartnerMembershipService][purchaseMembership] SMS confirmation failed", err),
        );
    }

    return { ok: true, membership };
  },
};
