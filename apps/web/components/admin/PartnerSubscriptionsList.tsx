"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPartnerSubscriptionDTO, AdminUserSubscriptionDTO } from "@bikie/types";

type SubscriptionRow = AdminPartnerSubscriptionDTO | AdminUserSubscriptionDTO;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

type Badge = { label: string; className: string };

/** Pure, local to this view — deliberately simpler than `admin-subscription-display.ts` (the
 * Transactions drawer's richer version, which needs `renewalCount` and other invoice-derived
 * detail this list doesn't fetch). The one state this list cares most about catching is
 * "never activated" (`startDate === endDate`, i.e. created on Razorpay but never successfully
 * charged) — exactly what a missed webhook leaves behind, and the reason this view exists. */
function badgeFor(sub: SubscriptionRow): Badge {
  const neverActivated = sub.startDate === sub.endDate;
  if (neverActivated) return { label: "Stuck — never charged", className: "bg-red-500/10 text-red-400" };
  if (sub.cancelledAt) return { label: "Cancelled", className: "bg-white/10 text-white/50" };
  if (sub.subscriptionStatus === "halted" || sub.subscriptionStatus === "pending") {
    return { label: "Payment problem", className: "bg-red-500/10 text-red-400" };
  }
  return { label: "Active", className: "bg-green-500/10 text-green-400" };
}

/**
 * "Who's subscribed" admin list — shared between Service Provider (`/admin/partner-membership`,
 * the original) and Rider (`/admin/membership`) via props, the same generalization pattern
 * `MembershipPlansManager` already uses. The cancel route is the SAME one for both account
 * types (`SubscriptionWebhookRouter.resolveAccountType` resolves which table owns a given
 * Razorpay subscription id server-side) — only the list endpoint and labels differ per type.
 */
export function PartnerSubscriptionsList({
  listUrl = "/api/admin/partner-membership/subscriptions",
  cancelUrl = "/api/admin/partner-membership/subscriptions/cancel",
  personLabel = "Service Provider",
  priceSuffix = "/mo",
  emptyMessage = "No Service Provider has ever started a subscription yet.",
}: {
  listUrl?: string;
  cancelUrl?: string;
  personLabel?: string;
  priceSuffix?: string;
  emptyMessage?: string;
}) {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(listUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { subscriptions: SubscriptionRow[] }) => setRows(data.subscriptions))
      .catch(() => setError("Could not load subscriptions. Please try again."))
      .finally(() => setLoading(false));
  }, [listUrl]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function cancel(sub: SubscriptionRow) {
    if (!sub.razorpaySubscriptionId) return;
    if (
      !confirm(
        `Cancel ${sub.userName}'s subscription? They keep access until ${fmtDate(sub.currentPeriodEnd ?? sub.endDate)}, but no further automatic payment will be taken.`,
      )
    ) {
      return;
    }
    setCancellingId(sub.id);
    try {
      const res = await fetch(cancelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpaySubscriptionId: sub.razorpaySubscriptionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(data.message ?? "Could not cancel this subscription.");
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/5" />;
  if (error) return <p className="mt-6 text-sm text-red-400">{error}</p>;
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-white/40">{emptyMessage}</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl bg-white/5">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">{personLabel}</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Next debit / paid through</th>
            <th className="px-4 py-3 font-medium">Started</th>
            <th className="px-4 py-3 font-medium">Razorpay subscription id</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sub) => {
            const badge = badgeFor(sub);
            const canCancel = badge.label !== "Cancelled";
            return (
              <tr key={sub.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{sub.userName}</p>
                  <p className="text-xs text-white/40">{sub.userEmail}{sub.userPhone ? ` · ${sub.userPhone}` : ""}</p>
                </td>
                <td className="px-4 py-3 text-white/70">{sub.plan.name}{sub.plan.price ? ` — ₹${sub.plan.price}${priceSuffix}` : ""}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                </td>
                <td className="px-4 py-3 text-white/70">{fmtDate(sub.currentPeriodEnd ?? sub.endDate)}</td>
                <td className="px-4 py-3 text-white/50">{fmtDateTime(sub.startDate)}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/50">{sub.razorpaySubscriptionId}</td>
                <td className="px-4 py-3 text-right">
                  {canCancel && (
                    <button
                      onClick={() => cancel(sub)}
                      disabled={cancellingId === sub.id}
                      className="text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
                    >
                      {cancellingId === sub.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
