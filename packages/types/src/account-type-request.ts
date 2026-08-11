export type AccountType = "RIDER" | "SERVICE_PROVIDER";

export type AccountTypeChangeRequestStatus = "PENDING" | "MORE_INFORMATION_REQUIRED" | "APPROVED" | "REJECTED";

/** ADR-053 — "I picked the wrong account type" support ticket. */
export interface AccountTypeChangeRequestDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string | null;
    accountType: AccountType;
  };
  currentType: AccountType;
  requestedType: AccountType;
  reason: string;
  supportingInfo: string | null;
  status: AccountTypeChangeRequestStatus;
  adminRemarks: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
