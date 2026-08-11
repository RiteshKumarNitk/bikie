/** ADR-051 — a Service Provider's own membership, entirely separate from MembershipPlanDTO/
 * UserMembershipDTO (Rider). */

export interface PartnerMembershipPlanDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
}

export interface PartnerMembershipDTO {
  id: string;
  userId: string;
  planId: string;
  plan: PartnerMembershipPlanDTO;
  startDate: string;
  endDate: string;
  status: string;
  daysLeft: number;
}
