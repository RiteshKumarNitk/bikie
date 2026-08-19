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

/** Renders "/month" or "/year" for the common billing periods, falling back to the raw day
 * count for anything else (e.g. the grandfathered 100-year legacy plan, if it's ever shown). */
function billingPeriodLabel(durationDays: number): string {
  if (durationDays === 30) return "/month";
  if (durationDays === 365) return "/year";
  return ` / ${durationDays} days`;
}

/** ADR-051/056 — a Service Provider's own membership, entirely separate from the Rider
 * `/membership` page it mirrors. A free plan (price 0) activates immediately with no payment
 * step; a paid plan opens the same `PaymentModal` pointed at the `/api/partner-membership/*`
 * routes instead of the Rider ones.
 *
 * ADR-056 — this is now also the mandatory next stop after `/partner-onboarding` (never a gate:
 * "Skip for Now" always reaches `/partner`). `?onboarding=1` only changes the copy — every other
 * behavior on this page, including Skip, is identical whether it's reached from onboarding or
 * from the sidebar later. Read via `window.location.search` rather than `useSearchParams()` to
 * match this app's existing pattern for optional query params on client pages (see
 * `(auth)/signup/page.tsx`) and avoid a Suspense-boundary requirement for one boolean flag. */
export default function PartnerMembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    setIsOnboarding(new URLSearchParams(window.location.search).get("onboarding") === "1");
  }, []);

  useEffect(() => {
    fetch("/api/partner-membership/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .catch((err) => {
        console.error("Failed to load plans:", err);
        setPlans([]);
      })
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
      {isOnboarding && !activeMembership && (
        <div className="mb-6 max-w-2xl rounded-2xl border border-accent/20 bg-accent/5 px-6 py-4">
          <p className="text-sm font-semibold">Your Service Provider profile is ready.</p>
          <p className="mt-1 text-sm text-foreground/70">
            Activate your ₹99/month membership to start receiving and responding to assistance
            requests — or skip for now and explore your dashboard first.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-semibold">Service Provider Membership</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Operating as a Service Provider — accepting SOS requests, listing your fleet, taking
        bookings — requires an active membership, separate from Rider membership. Your profile
        and business details are already saved either way.
      </p>

      {justPurchased && (
        <div className="mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
          <p>🎉 Membership activated!</p>
          <Link href="/partner" className="mt-2 inline-block font-semibold underline">
            Continue to Dashboard →
          </Link>
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
                  <span className="text-sm text-foreground/50">{billingPeriodLabel(plan.durationDays)}</span>
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

      {!activeMembership && !justPurchased && (
        <p className="mt-8 text-sm">
          <Link href="/partner" className="font-medium text-foreground/70 hover:text-foreground hover:underline">
            Skip for Now — explore the dashboard first →
          </Link>
        </p>
      )}
      {(activeMembership || justPurchased) && (
        <p className="mt-8 text-sm text-foreground/50">
          <Link href="/partner" className="text-accent-text hover:underline">← Back to Partner Dashboard</Link>
        </p>
      )}

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
