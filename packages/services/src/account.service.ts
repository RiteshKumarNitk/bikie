import { membershipRepository, partnerMembershipRepository } from "@bikie/database";
import { AdminService } from "./admin.service";
import { RazorpayService } from "./razorpay.service";

export type DeleteOwnAccountResult =
  | { ok: true; anonymized: boolean }
  | {
      ok: false;
      reason: "ACTIVE_SUBSCRIPTION" | "COULD_NOT_VERIFY_SUBSCRIPTION" | "ADMIN_PROTECTED" | "NOT_FOUND";
    };

const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["cancelled", "completed", "expired"]);

type OpenSubscriptionRow = { razorpaySubscriptionId?: string | null; cancelledAt?: string | null };

/**
 * `null` — nothing blocks deletion (no open subscription, or one that's already been cancelled —
 * `cancelledAt` is only ever set after a real, confirmed Razorpay cancel call succeeded, so it's
 * trustworthy without a live re-check). `"ACTIVE"` — genuinely still auto-renewing, verified
 * against Razorpay's own live state, not just the local row (which can lag a webhook). `"COULD_
 * NOT_VERIFY"` — Razorpay couldn't be reached to confirm; fails toward blocking deletion rather
 * than ever risking an account vanishing while money could still be taken from it.
 */
async function blockingReasonFor(
  findOpenSubscription: (userId: string) => Promise<OpenSubscriptionRow | null>,
  userId: string,
): Promise<"ACTIVE" | "COULD_NOT_VERIFY" | null> {
  const open = await findOpenSubscription(userId);
  if (!open?.razorpaySubscriptionId) return null;
  if (open.cancelledAt) return null;

  const live = await RazorpayService.fetchSubscription(open.razorpaySubscriptionId);
  if (!live) return "COULD_NOT_VERIFY";
  return TERMINAL_SUBSCRIPTION_STATUSES.has(live.status) ? null : "ACTIVE";
}

/**
 * Self-service "delete my account" — the counterpart to `AdminService.deleteUser`, which an
 * admin can already call on anyone. A user may only delete their own account while no recurring
 * Razorpay Subscription (Rider ₹149/year or Service Provider ₹99/month — either, or both) is
 * still actively auto-renewing: they must cancel auto-renewal first (the existing Cancel
 * Auto-Renewal flow), after which their membership stays usable until its already-paid period
 * ends, same as always — this only blocks *deletion*, never membership access. Once cancelled
 * (or never subscribed, or the subscription has already lapsed/completed), deletion proceeds
 * through the exact same path an admin-initiated deletion uses, which itself best-effort-cancels
 * any residual open subscription before scrubbing the account.
 */
export const AccountService = {
  async deleteOwnAccount(userId: string): Promise<DeleteOwnAccountResult> {
    const [riderBlock, partnerBlock] = await Promise.all([
      blockingReasonFor(membershipRepository.findOpenSubscriptionForUser, userId),
      blockingReasonFor(partnerMembershipRepository.findOpenSubscriptionForUser, userId),
    ]);

    if (riderBlock === "ACTIVE" || partnerBlock === "ACTIVE") {
      return { ok: false, reason: "ACTIVE_SUBSCRIPTION" };
    }
    if (riderBlock === "COULD_NOT_VERIFY" || partnerBlock === "COULD_NOT_VERIFY") {
      return { ok: false, reason: "COULD_NOT_VERIFY_SUBSCRIPTION" };
    }

    return AdminService.deleteUser(userId);
  },
};
