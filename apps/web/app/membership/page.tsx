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

export default function MembershipPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetch("/api/membership/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .finally(() => setLoading(false));
  }, []);

  function handlePurchase(plan: Plan) {
    if (!session) {
      router.push("/login?next=/membership");
      return;
    }
    setPurchaseError(null);
    setCheckoutPlan(plan);
  }

  function handleCheckoutSuccess() {
    setSuccessPlan(checkoutPlan?.id ?? null);
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

        {successPlan && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-sm text-success">
            🎉 Membership activated! You now have access to all premium benefits.
            <Link href="/dashboard" className="ml-2 font-medium underline">Go to Dashboard</Link>
          </div>
        )}

        {purchaseError && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-red-500/10 px-6 py-4 text-sm text-red-400">
            {purchaseError}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
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
                    <span className="mt-0.5 text-accent">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handlePurchase(plan)}
                disabled={successPlan !== null}
                className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {successPlan === plan.id ? "✓ Active" : "Get Started"}
              </button>
            </div>
          ))}
        </div>

        {!session && (
          <p className="mt-6 text-sm text-foreground/50">
            <Link href="/login?next=/membership" className="text-accent hover:underline">Log in</Link> to purchase a membership.
          </p>
        )}
      </div>

      {checkoutPlan && (
        <PaymentModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}