import type { Metadata } from "next";
import type { PartnerMembershipPlanDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { PartnerMembershipTabs } from "@/components/admin/PartnerMembershipTabs";

export const metadata: Metadata = { title: "Service Provider Membership" };

/** ADR-051 — Service Providers have their own membership, entirely separate from the Rider
 * plans at /admin/membership. Two tabs: the existing plan CRUD manager (reused against the
 * separate partner-membership plan table/routes), and a "who's subscribed" list sourced directly
 * from `PartnerMembership` rows — see `PartnerSubscriptionsList`'s own doc comment for why that's
 * not just the Transactions page filtered down. */
export default async function AdminPartnerMembershipPage() {
  const { plans } = await getJson<{ plans: PartnerMembershipPlanDTO[] }>("/api/admin/partner-membership/plans", {
    auth: true,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Service Provider Membership</h1>
      <p className="mt-1 text-sm text-white/50">
        Manage the membership plans Service Providers subscribe to, and see who currently has a
        recurring subscription — separate from Rider membership.
      </p>
      <PartnerMembershipTabs initialPlans={plans} />
    </div>
  );
}
