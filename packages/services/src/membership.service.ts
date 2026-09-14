import { billingRepository, membershipRepository, userRepository } from "@bikie/database";
import type { MembershipPlanDTO, UserMembershipDTO } from "@bikie/types";
import { maskPhone } from "./modules/communications/domain/phone";
import { MSG91_SMS_TEMPLATE_ENV, SMSService } from "./sms.service";
import { isRealRazorpayPaymentId } from "./billing.internal";

/** ADR-069 — discriminated result (mirrors `BookingService.create`'s shape): `ALREADY_ACTIVE`
 * is a business-rule rejection the route maps to `409`, not an exception. A replayed payment
 * for a membership that already exists still resolves `{ ok: true }` with that same row. */
export type PurchaseMembershipResult =
  | { ok: true; membership: UserMembershipDTO }
  | { ok: false; reason: "ALREADY_ACTIVE" };

export const MembershipService = {
  async getPlans(): Promise<MembershipPlanDTO[]> {
    return membershipRepository.findAllActivePlans();
  },

  async getActiveMembership(userId: string): Promise<UserMembershipDTO | null> {
    return membershipRepository.getActiveMembership(userId);
  },

  async getPlanById(planId: string): Promise<MembershipPlanDTO | null> {
    return membershipRepository.findPlanById(planId);
  },

  /** ADR-058 — the "BIKIE_Sub" DLT SMS confirmation is a best-effort side effect fired after the
   * membership row is created, mirroring `AccountTypeRequestService.review`'s established pattern
   * for this repo: a notification failure must never fail an otherwise-successful purchase, so
   * it's fire-and-forget with its own `.catch`, never awaited into the response. Rider-only —
   * see `SMSService.sendMembershipSubscribed`'s doc comment for why this must never fire for a
   * Service Provider membership purchase (`PartnerMembershipService`, a separate module/table). */
  async purchaseMembership(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string,
  ): Promise<PurchaseMembershipResult> {
    // ADR-069 — idempotent replay: this exact payment reference already activated a membership
    // (a re-fired Razorpay callback, a double-submit). Return that row, don't mint another and
    // don't re-fire the confirmation SMS.
    if (paymentId || razorpayOrderId) {
      const existing = await membershipRepository.findByPaymentReference({ paymentId, razorpayOrderId });
      if (existing) return { ok: true, membership: existing };
    }

    // ADR-069 — one active membership at a time. A *new* payment while already covered is a
    // client bug or a stale UI; reject it rather than stacking a second membership (there is no
    // renewal/upgrade flow yet — see ROADMAP Milestone 4).
    const active = await membershipRepository.getActiveMembership(userId);
    if (active) return { ok: false, reason: "ALREADY_ACTIVE" };

    const membership = await membershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
    const user = await userRepository.findById(userId);

    // ADR-070 — persist the immutable receipt. Every figure is snapshot from the row/plan we
    // just created; `createInvoice` is itself idempotent (unique on the membership id + payment
    // id), so a retry that gets past the guards above still yields exactly one invoice.
    const invoice = await billingRepository.createInvoice({
      userId,
      accountType: "RIDER",
      userMembershipId: membership.id,
      planId: membership.plan.id,
      planName: membership.plan.name,
      amount: membership.plan.price,
      durationDays: membership.plan.durationDays,
      membershipStartDate: new Date(membership.startDate),
      membershipEndDate: new Date(membership.endDate),
      customerName: user?.name ?? "BIKIE Member",
      customerPhone: user?.phoneNumber ?? null,
      paymentId: paymentId ?? null,
      razorpayPaymentId: isRealRazorpayPaymentId(paymentId) ? paymentId! : null,
      razorpayOrderId: razorpayOrderId ?? null,
      paidAt: new Date(),
    });

    // ADR-058/070/086 — the "BIKIE_Sub" DLT confirmation SMS: fired only here (after activation
    // AND the invoice), Rider-only, exactly once per activated membership. Fire-and-forget — a
    // delivery failure must never fail or roll back the purchase; `confirmationSmsSentAt` is
    // only stamped on a non-failing send, leaving a failed one visible for a later retry.
    const maskedPhone = maskPhone(user?.phoneNumber);
    if (!user?.phoneNumber) {
      console.log(
        `MEMBERSHIP_SMS_SKIPPED userId=${userId} invoiceId=${invoice.id} accountType=RIDER reason=NO_PHONE_ON_FILE`,
      );
    } else if (invoice.confirmationSmsSentAt) {
      console.log(
        `MEMBERSHIP_SMS_ALREADY_SENT userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone}`,
      );
    } else {
      console.log(
        `MEMBERSHIP_SMS_DISPATCH_START userId=${userId} invoiceId=${invoice.id} membershipId=${membership.id} ` +
          `accountType=RIDER phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}`,
      );
      SMSService.sendMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate))
        .then((res) => {
          if (res && res.ok === false) {
            // "unconfigured" is already logged (at error level, naming the exact env var) by
            // `resolveSmsTemplateId` inside SMSService itself — logging it again here at error
            // level would double the noise on every single purchase until the operator sets the
            // template id. A genuine send failure (MSG91 rejected it, network error, etc.) is a
            // real error worth its own line.
            if (res.provider === "unconfigured") {
              console.log(
                `MEMBERSHIP_SMS_UNCONFIGURED userId=${userId} invoiceId=${invoice.id} accountType=RIDER ` +
                  `phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}`,
              );
            } else {
              console.error(
                `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone} ` +
                  `template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED} reason=${(res.error ?? "unknown").slice(0, 200)}`,
              );
            }
            return;
          }
          // Gateway acceptance (see the SMS adapter's note) — `detail` is MSG91's request id for
          // a dashboard/DLR trace. Stamp `confirmationSmsSentAt` so it is never re-sent.
          console.log(
            `MEMBERSHIP_SMS_GATEWAY_ACCEPTED userId=${userId} invoiceId=${invoice.id} accountType=RIDER ` +
              `phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}` +
              `${res?.detail ? ` msg91ReqId=${res.detail}` : ""}`,
          );
          return billingRepository.markConfirmationSmsSent(invoice.id);
        })
        .catch((err) =>
          console.error(
            `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone} ` +
              `template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED} reason=${String(err).slice(0, 200)}`,
          ),
        );
    }

    return { ok: true, membership };
  },
};