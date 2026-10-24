"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PaymentModal, prefillFromSessionUser } from "@/components/membership/PaymentModal";
import { BillingHistory } from "@/components/membership/BillingHistory";
import { subscriptionDisplayState } from "@/lib/partner-subscription-display";
import { isTestPhoneNumber } from "@/lib/test-phone";

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
  plan: { name: string; price: number };
  daysLeft: number;
  endDate: string;
  razorpaySubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
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
  const { data: session } = authClient.useSession();
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

  // ADR-089 store-review/QA account — see `showLegacyPayOnce` below, the only remaining use of
  // the one-time flow for a paid plan.
  const isTestAccount = isTestPhoneNumber(session?.user?.phoneNumber ?? "");

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
      plan: { name: plan.name, price: plan.price },
      daysLeft: plan.durationDays,
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    });
    setJustPurchased(true);
    setCheckoutPlan(null);
  }

  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  /** Starts a recurring ₹99/month Razorpay Subscription — distinct from `handleSubscribe` below
   * (the existing one-time purchase flow, kept exactly as-is). Opens Razorpay's hosted
   * authorization page in a new tab; the membership only actually activates once Razorpay's
   * webhook confirms the first charge, so this reloads the active-membership state afterward
   * rather than assuming success. */
  async function handleStartSubscription(plan: Plan) {
    setPurchaseError(null);
    setSubscribingPlanId(plan.id);
    try {
      const res = await fetch("/api/partner-membership/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string; subscription?: { shortUrl: string } });
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not start the subscription. Please try again.",
        );
      }
      if (data.subscription?.shortUrl) {
        window.open(data.subscription.shortUrl, "_blank", "noopener,noreferrer");
      }
      setSubscriptionNotice(
        "Complete the payment authorization in the new tab. Your membership activates once the first payment is confirmed — refresh this page afterward.",
      );
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubscribingPlanId(null);
    }
  }

  /** Stops future recurring charges (`cancelAtCycleEnd`). The already-paid-for current period is
   * never retroactively revoked — membership stays active until `endDate` naturally passes. */
  async function handleCancelSubscription() {
    setIsCancelling(true);
    setPurchaseError(null);
    try {
      const res = await fetch("/api/partner-membership/subscription/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}) as { error?: string; membership?: ActiveMembership });
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not cancel the subscription.");
      }
      setActiveMembership(data.membership ?? null);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsCancelling(false);
    }
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
          {(() => {
            const state = subscriptionDisplayState(activeMembership);

            if (state.kind === "none") return null;

            if (state.kind === "cancelled") {
              return (
                <div className="mt-3 border-t border-success/20 pt-3 text-foreground/70">
                  <p className="font-medium">
                    Your subscription has been scheduled for cancellation. No further automatic payments will be
                    taken after the current paid period.
                  </p>
                  <dl className="mt-2 space-y-1">
                    <div>
                      <dt className="inline text-foreground/50">Current membership valid until: </dt>
                      <dd className="inline font-medium">{state.validUntilDate}</dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground/50">Next automatic payment: </dt>
                      <dd className="inline font-medium">Cancelled</dd>
                    </div>
                  </dl>
                </div>
              );
            }

            if (state.kind === "payment_problem") {
              return (
                <div className="mt-3 border-t border-success/20 pt-3">
                  <div className="rounded-xl bg-red-500/10 px-3 py-2 text-red-400">
                    <p className="font-semibold">Automatic payment failed</p>
                    <p className="mt-0.5">
                      We couldn&apos;t collect your ₹{activeMembership.plan.price} membership renewal payment. Please
                      update/check your payment method to keep your membership active.
                    </p>
                  </div>
                  <dl className="mt-2 space-y-1 text-foreground/70">
                    <div>
                      <dt className="inline text-foreground/50">Payment status: </dt>
                      <dd className="inline font-medium text-red-400">{state.statusLabel}</dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground/50">Membership valid until: </dt>
                      <dd className="inline font-medium">{state.validUntilDate}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="mt-2 text-red-400 underline disabled:opacity-50"
                  >
                    {isCancelling ? "Cancelling…" : "Cancel Auto-Renewal"}
                  </button>
                </div>
              );
            }

            // kind === "active"
            return (
              <div className="mt-3 border-t border-success/20 pt-3 text-foreground/70">
                <p className="font-semibold text-foreground">
                  ₹{activeMembership.plan.price}/month — Auto-renewing
                </p>
                <dl className="mt-2 space-y-1">
                  <div>
                    <dt className="inline text-foreground/50">Next payment: </dt>
                    <dd className="inline font-medium">
                      ₹{activeMembership.plan.price} on {state.nextPaymentDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-foreground/50">Membership valid until: </dt>
                    <dd className="inline font-medium">{state.validUntilDate}</dd>
                  </div>
                  <div>
                    <dt className="inline text-foreground/50">Next renewal: </dt>
                    <dd className="inline font-medium">{state.renewalDate}</dd>
                  </div>
                </dl>
                <p className="mt-2">
                  ₹{activeMembership.plan.price} will be automatically charged on <strong>{state.nextPaymentDate}</strong>.
                  Your membership will renew for another month after the successful payment.
                </p>

                {state.periodStartDate && (
                  <ol className="mt-3 space-y-1 border-l-2 border-success/30 pl-3 text-xs text-foreground/60">
                    <li>
                      <span className="font-medium text-foreground/80">{state.periodStartDate}</span> — Current
                      membership period started
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">{state.renewalDate}</span> — ₹
                      {activeMembership.plan.price} automatic deduction
                    </li>
                    <li>Membership renews for another month after the successful payment</li>
                  </ol>
                )}

                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="mt-3 text-red-400 underline disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling…" : "Cancel Auto-Renewal"}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {subscriptionNotice && (
        <div className="mt-6 max-w-md rounded-2xl bg-accent/10 px-6 py-4 text-sm text-accent-text">
          {subscriptionNotice}
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
            // ADR-089 store-review/QA account only — the sole remaining path that can still use
            // the one-time "Pay once" flow, since it can't complete a real Razorpay mandate
            // authorization. Every other Service Provider sees exactly one paid action: the real
            // monthly subscription. The backend enforces this independently of what the UI shows
            // (`ONE_TIME_CHECKOUT_DISABLED`/`ONE_TIME_PURCHASE_DISABLED`), so this is a UX choice,
            // not the only thing standing between a real SP and a one-time payment.
            const showLegacyPayOnce = !isFree && isTestAccount;
            return (
              <div key={plan.id} className="rounded-3xl border border-foreground/10 bg-card p-8 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">{plan.name}</p>
                <p className="mt-1 text-sm text-foreground/50">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold">{isFree ? "Free" : `₹${plan.price}`}</span>
                  <span className="text-sm text-foreground/50">{billingPeriodLabel(plan.durationDays)}</span>
                </p>
                {!isFree && !showLegacyPayOnce && (
                  <p className="mt-1 text-sm font-medium text-accent-text">Auto-renews automatically</p>
                )}
                <ul className="mt-6 space-y-3">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-accent-text">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                {isFree || showLegacyPayOnce ? (
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
                          : "Pay once"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartSubscription(plan)}
                      disabled={isActivePlan || subscribingPlanId === plan.id}
                      className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                    >
                      {isActivePlan
                        ? "✓ Active"
                        : subscribingPlanId === plan.id
                          ? "Starting…"
                          : `Start Membership — ₹${plan.price}/month`}
                    </button>
                    <p className="mt-2 text-center text-xs text-foreground/50">
                      Your payment will be automatically debited every month through your authorized Razorpay
                      payment method.
                    </p>
                  </>
                )}
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

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Payment history</h2>
        <div className="mt-4">
          <BillingHistory />
        </div>
      </section>

      {checkoutPlan && (
        <PaymentModal
          plan={checkoutPlan}
          prefill={prefillFromSessionUser(session?.user)}
          checkoutUrl="/api/partner-membership/checkout"
          purchaseUrl="/api/partner-membership/purchase"
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => handleCheckoutSuccess(checkoutPlan)}
        />
      )}
    </div>
  );
}
