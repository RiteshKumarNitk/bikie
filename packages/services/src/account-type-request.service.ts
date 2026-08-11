import { accountTypeRequestRepository } from "@bikie/database";
import { NotificationService } from "./notification.service";

export type AccountTypeRequestInput = {
  userId: string;
  currentType: string;
  requestedType: string;
  reason: string;
  supportingInfo?: string;
};

export type SubmitRequestResult =
  | { ok: true; request: Awaited<ReturnType<typeof accountTypeRequestRepository.createRequest>> }
  | { ok: false; reason: "ALREADY_OPEN" | "SAME_TYPE" };

const DECISION_COPY: Record<
  "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED",
  { type: string; title: string; body: (remarks?: string | null) => string }
> = {
  APPROVED: {
    type: "ACCOUNT_TYPE_CHANGE_APPROVED",
    title: "Your BIKIE account type has been changed",
    body: (remarks) => remarks ?? "Your account type change request was approved.",
  },
  REJECTED: {
    type: "ACCOUNT_TYPE_CHANGE_REJECTED",
    title: "Your account type change request was rejected",
    body: (remarks) => remarks ?? "Your account type change request was rejected.",
  },
  MORE_INFORMATION_REQUIRED: {
    type: "ACCOUNT_TYPE_CHANGE_INFO_REQUESTED",
    title: "More information needed for your account type change request",
    body: (remarks) => remarks ?? "Please provide more information to support your request.",
  },
};

/** ADR-053 — "I picked the wrong account type" customer-support workflow. `accountType` is
 * never self-service; this is the only path (besides initial registration) that can change it,
 * and only once an admin approves. */
export const AccountTypeRequestService = {
  async submitRequest(input: AccountTypeRequestInput): Promise<SubmitRequestResult> {
    if (input.currentType === input.requestedType) return { ok: false, reason: "SAME_TYPE" };

    const open = await accountTypeRequestRepository.findOpenRequestForUser(input.userId);
    if (open) return { ok: false, reason: "ALREADY_OPEN" };

    const request = await accountTypeRequestRepository.createRequest(input);
    return { ok: true, request };
  },

  async getMine(userId: string) {
    return accountTypeRequestRepository.findRequestsForUser(userId);
  },

  async getAll(status?: string) {
    return accountTypeRequestRepository.findAllRequests(status);
  },

  async getById(id: string) {
    return accountTypeRequestRepository.findRequestById(id);
  },

  /** The DB write (including flipping `User.accountType` on APPROVED) is the transactional
   * part; notifying the applicant is a best-effort side effect that must never make an
   * otherwise-successful decision fail — mirrors `AdminService.transitionPartnerVerification`. */
  async review(
    id: string,
    decision: "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED",
    opts: { adminRemarks?: string; adminUserId: string },
  ) {
    const result = await accountTypeRequestRepository.reviewRequest(id, decision, opts);
    if (result.ok) {
      const copy = DECISION_COPY[decision];
      await NotificationService.notify(
        result.userId,
        copy.type as any,
        copy.title,
        copy.body(opts.adminRemarks),
        "AccountTypeChangeRequest",
        id,
      ).catch((err) => console.error("[AccountTypeRequest][review] notify failed", err));
    }
    return result;
  },
};
