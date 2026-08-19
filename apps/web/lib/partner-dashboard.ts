import type { PartnerDashboardStatsDTO } from "@bikie/types";

/**
 * ADR-055 — the fallback for `/api/partner/dashboard` when a Service Provider account is inside
 * `/partner/**` but not yet entitled to the capability-gated API (no active Service Provider
 * membership — see `getJsonOrFallback` in `lib/api.ts` for why that gap exists by design).
 *
 * Zeroes are the honest rendering here rather than a lie: such an account has no fleet, no
 * bookings and no reviews yet, so every counter genuinely is 0. Shared by `/partner`,
 * `/partner/analytics` and `/partner/payouts`, which all read the same endpoint.
 */
export const ZERO_PARTNER_STATS: PartnerDashboardStatsDTO = {
  totalBikes: 0,
  activeBookings: 0,
  completedBookings: 0,
  totalEarnings: 0,
  ratingAvg: 0,
  ratingCount: 0,
};
