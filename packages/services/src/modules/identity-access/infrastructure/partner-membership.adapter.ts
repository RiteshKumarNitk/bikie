import { partnerMembershipRepository } from "@bikie/database";
import type { PartnerMembershipPort } from "../ports";

export function createPartnerMembershipAdapter(): PartnerMembershipPort {
  return {
    async hasActivePartnerMembership(userId) {
      const membership = await partnerMembershipRepository.getActiveMembership(userId);
      return membership !== null;
    },
  };
}
