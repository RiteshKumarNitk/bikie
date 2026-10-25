import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/**
 * `GET /api/admin/partner-membership/subscriptions` — every Service Provider who has (or has
 * ever had) a Razorpay-backed subscription, most recent first. Sourced from `PartnerMembership`
 * rows directly (via `PartnerMembershipService.listAllSubscriptions`), not from invoices — a
 * subscription created but never successfully charged (exactly what a missed webhook leaves
 * behind) still shows up here, which a transaction-based view would never surface.
 */
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const subscriptions = await PartnerMembershipService.listAllSubscriptions();
  return NextResponse.json({ subscriptions });
}
