import { membershipRepository } from "@bikie/database";
import type { MembershipPlanDTO, UserMembershipDTO } from "@bikie/types";

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

  async purchaseMembership(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string,
  ): Promise<UserMembershipDTO> {
    return membershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
  },
};