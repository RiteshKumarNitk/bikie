import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export type PartnerProfileInput = {
  businessName: string;
  type: string;
  city: string;
  description?: string;
  aadhaarNumber?: string;
  contactPerson1Name?: string;
  contactPerson1Mobile?: string;
  contactPerson2Name?: string;
  contactPerson2Mobile?: string;
};

export interface PartnerRepositoryPort {
  findByUserId(userId: string): Promise<PartnerProfileDTO | null>;
  upsertProfile(userId: string, data: PartnerProfileInput): Promise<PartnerProfileDTO>;
  getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO>;
}

export interface PartnersPorts {
  partners: PartnerRepositoryPort;
}
