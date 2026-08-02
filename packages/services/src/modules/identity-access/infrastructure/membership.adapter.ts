import { membershipRepository } from "@bikie/database";
import type { MembershipPort } from "../ports";

export function createMembershipAdapter(): MembershipPort {
  return {
    async hasActiveMembership(userId) {
      const membership = await membershipRepository.getActiveMembership(userId);
      return membership !== null;
    },
  };
}
