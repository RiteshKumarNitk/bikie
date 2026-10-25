"use client";

import { useState } from "react";
import { MembershipPlansManager } from "@/components/admin/MembershipPlansManager";
import { PartnerSubscriptionsList } from "@/components/admin/PartnerSubscriptionsList";

type Plan = Parameters<typeof MembershipPlansManager>[0]["initial"][number];

const TABS = ["Plans", "Subscriptions"] as const;

/** Tabs for the Service Provider Membership admin page: the existing plan CRUD manager, and a
 * new "who's subscribed" list — kept as separate tabs on one page rather than two pages, since
 * both are about the same SP-membership surface and an admin managing one is likely to need the
 * other. */
export function PartnerMembershipTabs({ initialPlans }: { initialPlans: Plan[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Plans");

  return (
    <div>
      <div className="mt-6 flex gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? "border-b-2 border-gold text-white" : "text-white/50 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Plans" ? (
        <MembershipPlansManager initial={initialPlans} basePath="/api/admin/partner-membership/plans" defaultDurationDays={365} />
      ) : (
        <PartnerSubscriptionsList />
      )}
    </div>
  );
}
