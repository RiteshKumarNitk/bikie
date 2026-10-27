"use client";

import { useState } from "react";
import { MembershipPlansManager } from "@/components/admin/MembershipPlansManager";
import { PartnerSubscriptionsList } from "@/components/admin/PartnerSubscriptionsList";

type Plan = Parameters<typeof MembershipPlansManager>[0]["initial"][number];

const TABS = ["Plans", "Subscriptions"] as const;

/** Tabs for the Rider Membership admin page — mirrors `PartnerMembershipTabs` exactly (same
 * two-tab shape: the existing plan CRUD manager, and the "who's subscribed" list, generalized via
 * props rather than duplicated). */
export function MembershipTabs({ initialPlans }: { initialPlans: Plan[] }) {
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
        <MembershipPlansManager initial={initialPlans} />
      ) : (
        <PartnerSubscriptionsList
          listUrl="/api/admin/membership/subscriptions"
          cancelUrl="/api/admin/partner-membership/subscriptions/cancel"
          personLabel="Rider"
          priceSuffix="/yr"
          emptyMessage="No Rider has ever started a subscription yet."
        />
      )}
    </div>
  );
}
