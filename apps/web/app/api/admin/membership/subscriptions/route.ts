import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/**
 * `GET /api/admin/membership/subscriptions` — every Rider who has (or has ever had) a
 * Razorpay-backed yearly subscription, most recent first. Mirrors `GET /api/admin/
 * partner-membership/subscriptions` exactly. Sourced from `UserMembership` rows directly (via
 * `MembershipService.listAllSubscriptions`), not from invoices — a subscription created but never
 * successfully charged (exactly what a missed webhook leaves behind) still shows up here, which a
 * transaction-based view would never surface.
 */
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const subscriptions = await MembershipService.listAllSubscriptions();
  return NextResponse.json({ subscriptions });
}
