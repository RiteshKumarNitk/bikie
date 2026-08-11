"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PaymentModal } from "@/components/membership/PaymentModal";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
}

interface ActiveMembership {
  planId: string;
  plan: { name: string };
  daysLeft: number;
  endDate: string;
}

/** ADR-051 — a Service Provider's own membership, entirely separate from the Rider
 * `/membership` page it mirrors. A free plan (price 0) activates immediately with no payment
 * step; a paid plan opens the same `PaymentModal` pointed at the `/api/partner-membership/*`
 * routes instead of the Rider ones. */
export default function PartnerMembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);

  useEffect(() => {
    fetch("/api/partner-membership/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/partner-membership/active")
      .then((r) => r.json())
      .then((data) => setActiveMembership(data.membership ?? null))
      .catch(() => {});
  }, []);

  function handleCheckoutSuccess(plan: Plan) {
    setActiveMembership({
      planId: plan.id,
      plan: { name: plan.name },
      daysLeft: plan.durationDays,
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    });
    setJustPurchased(true);
    setCheckoutPlan(null);
  }

  async function handleSubscribe(plan: Plan) {
    setPurchaseError(null);
    if (plan.price > 0) {
      setCheckoutPlan(plan);
      return;
    }
    setActivatingPlanId(plan.id);
    try {
      const res = await fetch("/api/partner-membership/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(data.message ?? "Could not activate this plan.");
      }
      handleCheckoutSuccess(plan);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActivatingPlanId(null);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Service Provider Membership</h1>
      <p className="mt-1 text-sm text-foreground/50">
        A Service Provider capability requires an active membership — separate from Rider
        membership. Your admin may offer a free plan.
      </p>

      {justPurchased && (
        <div className="mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
          🎉 Membership activated!
        </div>
      )}

      {!justPurchased && activeMembership && (
        <div className="mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
          ✓ Your {activeMembership.plan.name} membership is active — {activeMembership.daysLeft} day
          {activeMembership.daysLeft === 1 ? "" : "s"} left.
        </div>
      )}

      {purchaseError && (
        <div className="mt-6 max-w-md rounded-2xl bg-red-500/10 px-6 py-4 text-sm text-red-400">
          {purchaseError}
        </div>
      )}

      {plans.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/50">
          No Service Provider membership plans are available yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActivePlan = activeMembership?.planId === plan.id;
            const isFree = plan.price === 0;
            return (
              <div key={plan.id} className="rounded-3xl border border-foreground/10 bg-card p-8 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">{plan.name}</p>
                <p className="mt-1 text-sm text-foreground/50">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold">{isFree ? "Free" : `₹${plan.price}`}</span>
                  <span className="text-sm text-foreground/50"> / {plan.durationDays} days</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-accent-text">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan)}
                  disabled={isActivePlan || activatingPlanId === plan.id}
                  className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {isActivePlan
                    ? "✓ Active"
                    : activatingPlanId === plan.id
                      ? "Activating…"
                      : isFree
                        ? "Activate for free"
                        : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-sm text-foreground/50">
        <Link href="/partner" className="text-accent-text hover:underline">← Back to Partner Dashboard</Link>
      </p>

      {checkoutPlan && (
        <PaymentModal
          plan={checkoutPlan}
          checkoutUrl="/api/partner-membership/checkout"
          purchaseUrl="/api/partner-membership/purchase"
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => handleCheckoutSuccess(checkoutPlan)}
        />
      )}
    </div>
  );
}
