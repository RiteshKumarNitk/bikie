export interface ReferralInfoDTO {
  code: string;
  referrals: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }[];
}

export interface AdminReferralDTO {
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  createdAt: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
}
