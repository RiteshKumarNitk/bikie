import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export type PartnerProfileInput = {
  businessName: string;
  type: string;
  city: string;
  description?: string;
  contactPerson1Name?: string;
  contactPerson1Mobile?: string;
  contactPerson2Name?: string;
  contactPerson2Mobile?: string;
  addressLine?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  governmentIdType?: string;
  governmentIdNumber?: string;
};

/** Public "find a service provider near me" result — a lighter shape than PartnerProfileDTO,
 * just what a map pin + list row needs. */
export interface NearbyPartnerRow {
  id: string;
  businessName: string;
  type: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export interface PartnerRepositoryPort {
  findByUserId(userId: string): Promise<PartnerProfileDTO | null>;
  upsertProfile(userId: string, data: PartnerProfileInput): Promise<PartnerProfileDTO>;
  getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO>;
  findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    options?: { type?: string; take?: number },
  ): Promise<NearbyPartnerRow[]>;
}

export interface PartnersPorts {
  partners: PartnerRepositoryPort;
}
