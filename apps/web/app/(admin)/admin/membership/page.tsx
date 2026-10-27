import type { Metadata } from "next";
import type { MembershipPlanDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { MembershipTabs } from "@/components/admin/MembershipTabs";

export const metadata: Metadata = { title: "Rider Membership" };

/** Mirrors `/admin/partner-membership` — two tabs: the existing plan CRUD manager, and a
 * "who's subscribed" list sourced directly from `UserMembership` rows (see
 * `PartnerSubscriptionsList`'s own doc comment for why that's not just Transactions filtered
 * down). Was plan-management-only until the Rider yearly subscription existed to list. */
export default async function AdminMembershipPage() {
  const { plans } = await getJson<{ plans: MembershipPlanDTO[] }>("/api/admin/membership/plans", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Rider Membership</h1>
      <p className="mt-1 text-sm text-white/50">
        Manage the membership plans Riders subscribe to, and see who currently has a recurring
        subscription — separate from Service Provider membership.
      </p>
      <MembershipTabs initialPlans={plans} />
    </div>
  );
}
