import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { MembershipPlansManager } from "@/components/admin/MembershipPlansManager";

export const metadata: Metadata = { title: "Service Provider Membership Plans" };

/** ADR-051 — Service Providers have their own membership, entirely separate from the Rider
 * plans at /admin/membership. Reuses the same manager component against the separate
 * partner-membership plan table/routes. */
export default async function AdminPartnerMembershipPage() {
  const { plans } = await getJson<{ plans: any[] }>("/api/admin/partner-membership/plans", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Service Provider Membership Plans</h1>
      <p className="mt-1 text-sm text-white/50">
        Create and manage the membership plans Service Providers subscribe to — separate from Rider
        membership. Set price to 0 for a free plan.
      </p>
      <MembershipPlansManager initial={plans} basePath="/api/admin/partner-membership/plans" defaultDurationDays={365} />
    </div>
  );
}
