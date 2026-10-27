import { NextResponse } from "next/server";
import { invalidateCachedUserSessions } from "@bikie/auth";
import { AccountService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  ACTIVE_SUBSCRIPTION: 409,
  COULD_NOT_VERIFY_SUBSCRIPTION: 503,
  ADMIN_PROTECTED: 400,
  NOT_FOUND: 404,
};

const ERROR_MESSAGE: Record<string, string> = {
  ACTIVE_SUBSCRIPTION:
    "You have an active auto-renewing subscription. Please cancel auto-renewal first, then delete your account.",
  COULD_NOT_VERIFY_SUBSCRIPTION:
    "We couldn't verify your subscription status right now. Please try again in a moment.",
  ADMIN_PROTECTED: "Admin accounts cannot be deleted this way.",
  NOT_FOUND: "Account not found.",
};

/**
 * `POST /api/user/delete-account` — self-service account deletion. A user may only delete their
 * own account (never another id — always `session.user.id`, never client-supplied) while no
 * recurring Razorpay Subscription (Rider or Service Provider) is still actively auto-renewing;
 * `AccountService.deleteOwnAccount` verifies this against Razorpay's own live state, not just the
 * locally-stored flag. Once cancelled (or never subscribed, or lapsed), this reuses the exact
 * same deletion path `DELETE /api/admin/users/[id]` uses.
 */
export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  // Before the delete/anonymize itself — the fast hard-delete path removes the `Session` rows
  // this reads to find which cache entries to clear, mirroring the admin delete route.
  await invalidateCachedUserSessions(session.user.id);

  const result = await AccountService.deleteOwnAccount(session.user.id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: ERROR_MESSAGE[result.reason] },
      { status: ERROR_STATUS[result.reason] ?? 400 },
    );
  }

  return NextResponse.json({ ok: true, anonymized: result.anonymized });
}
