import { membershipRepository, userRepository } from "@bikie/database";
import type { MembershipPlanDTO, UserMembershipDTO } from "@bikie/types";
import { SMSService } from "./sms.service";

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
  ): Promise<UserMembershipDTO> {
    const membership = await membershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
    const user = await userRepository.findById(userId);
    if (user?.phoneNumber) {
      SMSService.sendMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate)).catch((err) =>
        console.error("[MembershipService][purchaseMembership] SMS confirmation failed", err),
      );
    }
    return membership;
  },
};