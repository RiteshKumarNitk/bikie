import { partnerMembershipRepository } from "@bikie/database";
import type { PartnerMembershipPlanDTO, PartnerMembershipDTO } from "@bikie/types";

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
  ): Promise<PartnerMembershipDTO> {
    return partnerMembershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
  },
};
