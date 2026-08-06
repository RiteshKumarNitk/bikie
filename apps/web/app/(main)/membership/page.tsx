"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
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

export default function MembershipPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // The membership that's actually active right now, per the server — this is the source of
  // truth for whether a plan shows "Get Started" or "Active." A previous version tracked this
  // with local state set only right after a purchase completed, which reset to nothing on any
  // reload or repeat visit — so someone who'd already paid, then came back to this page later,
  // saw every plan offering "Get Started" again as if nothing had ever been purchased.
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  // Distinct from `activeMembership` — only true for the celebratory banner right after a
  // checkout on *this* visit; an existing membership from a previous visit shouldn't re-show
  // "activated!" every time the page loads.
  const [justPurchased, setJustPurchased] = useState(false);

  useEffect(() => {
    fetch("/api/membership/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => setActiveMembership(data.membership ?? null))
      .catch(() => {});
  }, [session]);

  function handlePurchase(plan: Plan) {
    if (!session) {
      router.push("/login?next=/membership");
      return;
    }
    setPurchaseError(null);
    setCheckoutPlan(plan);
  }

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

  if (loading) {
    return (
      <div className="pb-24">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Membership" }]} />
        <div className="mx-auto mt-12 max-w-5xl px-6">
          <div className="h-64 animate-pulse rounded-3xl bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Membership" }]} />

      <div className="mx-auto max-w-5xl px-6 pt-6 text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">BIKIE Premium Membership</h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/60">
          Unlock exclusive benefits, discounts, and priority support across every ride.
        </p>

        {justPurchased && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
            🎉 Membership activated! You now have access to all premium benefits.
            <Link href="/dashboard" className="ml-2 font-medium underline">Go to Dashboard</Link>
          </div>
        )}

        {!justPurchased && activeMembership && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
            ✓ Your {activeMembership.plan.name} membership is active — {activeMembership.daysLeft} day
            {activeMembership.daysLeft === 1 ? "" : "s"} left.
          </div>
        )}

        {purchaseError && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-red-500/10 px-6 py-4 text-sm text-red-400">
            {purchaseError}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActivePlan = activeMembership?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border bg-card p-8 text-left transition-all hover:shadow-xl ${
                  plan.name === "Premium" ? "border-accent ring-1 ring-accent/30" : "border-foreground/10"
                }`}
              >
                {plan.name === "Premium" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">{plan.name}</p>
                <p className="mt-1 text-sm text-foreground/50">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
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
                  onClick={() => handlePurchase(plan)}
                  disabled={isActivePlan}
                  className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {isActivePlan ? "✓ Active" : "Get Started"}
                </button>
              </div>
            );
          })}
        </div>

        {!session && (
          <p className="mt-6 text-sm text-foreground/50">
            <Link href="/login?next=/membership" className="text-accent-text hover:underline">Log in</Link> to purchase a membership.
          </p>
        )}
      </div>

      {checkoutPlan && (
        <PaymentModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => handleCheckoutSuccess(checkoutPlan)}
        />
      )}
    </div>
  );
}