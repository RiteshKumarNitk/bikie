import { billingRepository, partnerMembershipRepository, userRepository } from "@bikie/database";
import type { PartnerMembershipPlanDTO, PartnerMembershipDTO } from "@bikie/types";
import { isRealRazorpayPaymentId } from "./billing.internal";
import { maskPhone } from "./modules/communications/domain/phone";
import { MSG91_SMS_TEMPLATE_ENV, SMSService } from "./sms.service";

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

    // ADR-080/086 — Service Provider membership confirmation SMS: separate from the Rider
    // "BIKIE_Sub" template (annual-specific text, wrong for this monthly plan — see
    // `SMSService.sendPartnerMembershipSubscribed`'s doc comment). Mirrors the Rider flow exactly
    // otherwise: fire-and-forget, never fails/rolls back the purchase, deduped by the same
    // `confirmationSmsSentAt` guard. Refuses cleanly (logged, retryable) until the operator
    // registers a real SP DLT template and sets both its env vars — never sends the Rider
    // template just because a payment succeeded.
    const maskedPhone = maskPhone(user?.phoneNumber);
    const template = MSG91_SMS_TEMPLATE_ENV.PARTNER_MEMBERSHIP_SUBSCRIBED;
    if (!user?.phoneNumber) {
      console.log(
        `MEMBERSHIP_SMS_SKIPPED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER reason=NO_PHONE_ON_FILE`,
      );
    } else if (invoice.confirmationSmsSentAt) {
      console.log(
        `MEMBERSHIP_SMS_ALREADY_SENT userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER phone=${maskedPhone}`,
      );
    } else {
      console.log(
        `MEMBERSHIP_SMS_DISPATCH_START userId=${userId} invoiceId=${invoice.id} membershipId=${membership.id} ` +
          `accountType=SERVICE_PROVIDER phone=${maskedPhone} template=${template}`,
      );
      SMSService.sendPartnerMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate))
        .then((res) => {
          if (res && res.ok === false) {
            // "unconfigured" is already logged (at error level, naming the exact env var(s)) by
            // SMSService itself — logging it again here at error level would double the noise on
            // every single purchase until the operator registers the SP template. A genuine send
            // failure is a real error worth its own line.
            if (res.provider === "unconfigured") {
              console.log(
                `MEMBERSHIP_SMS_UNCONFIGURED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
                  `phone=${maskedPhone} template=${template}`,
              );
            } else {
              console.error(
                `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
                  `phone=${maskedPhone} template=${template} reason=${(res.error ?? "unknown").slice(0, 200)}`,
              );
            }
            return;
          }
          console.log(
            `MEMBERSHIP_SMS_GATEWAY_ACCEPTED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
              `phone=${maskedPhone} template=${template}${res?.detail ? ` msg91ReqId=${res.detail}` : ""}`,
          );
          return billingRepository.markConfirmationSmsSent(invoice.id);
        })
        .catch((err) =>
          console.error(
            `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
              `phone=${maskedPhone} template=${template} reason=${String(err).slice(0, 200)}`,
          ),
        );
    }

    return { ok: true, membership };
  },
};
