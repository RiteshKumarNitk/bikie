export interface MembershipPlanDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
}

export interface UserMembershipDTO {
  id: string;
  userId: string;
  planId: string;
  plan: MembershipPlanDTO;
  startDate: string;
  endDate: string;
  status: string;
  daysLeft: number;
}