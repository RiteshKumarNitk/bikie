"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { PaymentModal, prefillFromSessionUser } from "@/components/membership/PaymentModal";
import { BillingHistory } from "@/components/membership/BillingHistory";
import { subscriptionDisplayState } from "@/lib/subscription-display";
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

/** ADR-043/ADR-095 (Rider yearly auto-renewal) — the Rider's own membership, entirely separate
 * from the Service Provider `/partner/membership` page it mirrors (same narrowing as ADR-094's
 * SP page). A free plan activates immediately with no payment step. A paid plan is
 * yearly-auto-debit-only for a real Rider — the sole action is "Start Yearly Membership" (a real
 * recurring Razorpay Subscription); "Pay once" only still appears for the store-review/QA test
 * account, which can't complete a real mandate authorization. An existing Rider's already-active
 * one-time membership is untouched either way — this only changes what a NEW purchase offers. */
export default function MembershipPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isTestAccount = isTestPhoneNumber(session?.user?.phoneNumber ?? "");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // The membership that's actually active right now, per the server — this is the source of
  // truth for whether a plan shows "Get Started" or "Active." A previous version tracked this
  // with local state set only right after a purchase completed, which reset to nothing on any
  // reload or repeat visit — so someone who'd already paid, then came back to this page later,
  // saw every plan offering "Get Started" again as if nothing had ever been purchased.
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  // A subscription that's been created (Razorpay authorization started or finished) but hasn't
  // been webhook-confirmed charged yet — distinct from `activeMembership`, which is only ever set
  // once Razorpay has actually confirmed a charge. Never treated as activation by itself; see
  // `handleStartSubscription` and the polling effect below — only a later refresh that returns a
  // real `activeMembership` (webhook-driven) ever flips the UI to "active".
  const [pendingSubscription, setPendingSubscription] = useState<ActiveMembership | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  // Distinct from `activeMembership` — only true for the celebratory banner right after a
  // checkout on *this* visit; an existing membership from a previous visit shouldn't re-show
  // "activated!" every time the page loads.
  const [justPurchased, setJustPurchased] = useState(false);

  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/membership/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .finally(() => setLoading(false));
  }, []);

  // Single source of truth for "what does the server say right now" — called on load, on
  // tab-return, and by the bounded poller below. Never guesses: `activeMembership` only ever
  // becomes non-null when the server itself says so (webhook-driven), never from the mere fact
  // that this was just called.
  const refreshMembership = useCallback(async () => {
    try {
      const res = await fetch("/api/membership/active");
      const data = await res.json();
      setActiveMembership(data.membership ?? null);
      setPendingSubscription(data.pendingSubscription ?? null);
    } catch {
      // Transient — the next poll tick or tab-focus retries; never surface a fetch blip as an error.
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    // Inline (not a call to the shared `refreshMembership`) to match this file's existing
    // plans-fetch effect's shape — satisfies `react-hooks/set-state-in-effect`, which flags an
    // effect body whose own top-level statement is a direct call to a function reference that
    // sets state, but not an inline promise chain like this one.
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => {
        setActiveMembership(data.membership ?? null);
        setPendingSubscription(data.pendingSubscription ?? null);
      })
      .catch(() => {});
  }, [session]);

  // Razorpay's hosted Subscription authorization page has no `callback_url`/redirect mechanism
  // (unlike their one-time Checkout) — opening it in a new tab leaves this tab with no way to know
  // when the Rider is done. Razorpay's own guidance is not to rely on a redirect at all; the
  // nearest thing to "auto-refresh on return" achievable here is re-fetching whenever this tab
  // regains focus (covers switching back from the Razorpay tab, or closing it) — same reasoning as
  // the mobile app's `AppLifecycleState.resumed` refresh.
  useEffect(() => {
    if (!session) return;
    function refreshOnReturn() {
      if (document.visibilityState !== "visible") return;
      refreshMembership();
    }
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);
    return () => {
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, [session, refreshMembership]);

  // Bounded polling while a subscription exists but hasn't been webhook-confirmed yet (just
  // started, or the Rider returned from Razorpay before the webhook landed) — catches a webhook
  // that arrives a few seconds after return without the Rider needing to manually refresh. Capped
  // (12 tries, 5s apart = 1 minute) rather than indefinite: if it's still pending after a minute,
  // the tab-focus refresh above and the existing stale-subscription retry logic (on the next
  // "Start Yearly Membership" tap) take over — this is only for catching the common fast case.
  const pollAttemptsRef = useRef(0);
  useEffect(() => {
    if (!pendingSubscription) {
      pollAttemptsRef.current = 0;
      return;
    }
    if (pollAttemptsRef.current >= 12) return;
    const timer = setTimeout(() => {
      pollAttemptsRef.current += 1;
      refreshMembership();
    }, 5000);
    return () => clearTimeout(timer);
  }, [pendingSubscription, refreshMembership]);

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
      plan: { name: plan.name, price: plan.price },
      daysLeft: plan.durationDays,
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    });
    setJustPurchased(true);
    setCheckoutPlan(null);
  }

  /** Starts a recurring ₹149/year Razorpay Subscription — distinct from `handlePurchase` above
   * (the existing one-time purchase flow, kept exactly as-is, never removed). Opens Razorpay's
   * hosted authorization page in a new tab; the membership only actually activates once
   * Razorpay's webhook confirms the first charge, so this reloads the active-membership state
   * afterward rather than assuming success. */
  async function handleStartSubscription(plan: Plan) {
    if (!session) {
      router.push("/login?next=/membership");
      return;
    }
    setPurchaseError(null);
    setSubscribingPlanId(plan.id);
    try {
      const res = await fetch("/api/membership/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res
        .json()
        .catch(() => ({}) as { error?: string; message?: string; subscription?: { shortUrl: string } });
      if (!res.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : "Could not start the subscription. Please try again.",
        );
      }
      if (data.subscription?.shortUrl) {
        window.open(data.subscription.shortUrl, "_blank", "noopener,noreferrer");
      }
      setSubscriptionNotice(
        "Complete the payment authorization in the new tab. This page will update automatically once it's confirmed.",
      );
      // Picks up the new pending subscription right away (rather than waiting for the next tab
      // focus or poll tick) so the "payment pending" card below appears immediately.
      await refreshMembership();
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
      const res = await fetch("/api/membership/subscription/cancel", { method: "POST" });
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

        {/* Not yet webhook-confirmed — never shown as active. Razorpay's own AutoPay
            authorization step can genuinely take a while (or the Rider may need to retry); this
            is the honest "we don't know the final result yet" state, kept distinct from both
            "active" and "failed" per spec — never faked to either. */}
        {!justPurchased && !activeMembership && pendingSubscription && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-accent/10 px-6 py-4 text-left text-sm text-accent-text">
            <p className="font-semibold">⏳ Payment processing</p>
            <p className="mt-1 text-foreground/70">
              We&apos;re waiting for Razorpay to confirm your ₹{pendingSubscription.plan.price}/year payment. This
              page checks automatically — no need to keep refreshing. If this doesn&apos;t resolve in a few
              minutes, you can safely try again below.
            </p>
          </div>
        )}

        {!justPurchased && activeMembership && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-success/10 px-6 py-4 text-left text-sm text-success">
            <p>
              ✓ Your {activeMembership.plan.name} membership is active — {activeMembership.daysLeft} day
              {activeMembership.daysLeft === 1 ? "" : "s"} left.
            </p>
            {(() => {
              const state = subscriptionDisplayState(activeMembership);

              if (state.kind === "none") return null;

              if (state.kind === "cancelled") {
                return (
                  <div className="mt-3 border-t border-success/20 pt-3 text-foreground/70">
                    <p className="font-medium">
                      Auto-renewal cancelled. No further automatic payment will be taken.
                    </p>
                    <dl className="mt-2 space-y-1">
                      <div>
                        <dt className="inline text-foreground/50">Membership remains active until: </dt>
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
                      <p className="font-semibold">⚠️ There is a problem with your yearly membership renewal</p>
                      <p className="mt-0.5">
                        We couldn&apos;t collect your ₹{activeMembership.plan.price} membership renewal payment.
                        Please check your payment method to keep your membership active.
                      </p>
                    </div>
                    <dl className="mt-2 space-y-1 text-foreground/70">
                      <div>
                        <dt className="inline text-foreground/50">Subscription status: </dt>
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
                  <p className="font-semibold text-foreground">Auto-Renewal: ON</p>
                  <dl className="mt-2 space-y-1">
                    <div>
                      <dt className="inline text-foreground/50">Amount: </dt>
                      <dd className="inline font-medium">₹{activeMembership.plan.price}/year</dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground/50">Next automatic payment: </dt>
                      <dd className="inline font-medium">{state.nextPaymentDate}</dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground/50">Membership valid until: </dt>
                      <dd className="inline font-medium">{state.validUntilDate}</dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground/50">Subscription status: </dt>
                      <dd className="inline font-medium">Active</dd>
                    </div>
                  </dl>
                  <p className="mt-2">
                    ₹{activeMembership.plan.price} will be automatically debited on <strong>{state.nextPaymentDate}</strong>.
                    Your membership will renew for another year after the successful payment.
                  </p>

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
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-accent/10 px-6 py-4 text-sm text-accent-text">
            {subscriptionNotice}
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
            const isFree = plan.price === 0;
            // The store-review/QA Rider test account only — the sole remaining path that can
            // still use the one-time "Pay once" flow, since it can't complete a real Razorpay
            // mandate authorization. Every other Rider sees exactly one paid action: the real
            // yearly subscription. The backend enforces this independently of what the UI shows
            // (`ONE_TIME_CHECKOUT_DISABLED`/`ONE_TIME_PURCHASE_DISABLED`), so this is a UX choice,
            // not the only thing standing between a real Rider and a one-time payment. An existing
            // Rider's already-active one-time membership keeps working exactly as it always has —
            // this only affects the buttons shown for a NEW purchase.
            const showLegacyPayOnce = !isFree && isTestAccount;
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
                    onClick={() => handlePurchase(plan)}
                    disabled={isActivePlan}
                    className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {isActivePlan ? "✓ Active" : isFree ? "Get Started" : "Pay once"}
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
                          : `Start Yearly Membership — ₹${plan.price}/year`}
                    </button>
                    <p className="mt-2 text-center text-xs text-foreground/50">
                      Your payment will be automatically debited every year through your authorized Razorpay
                      payment method.
                    </p>
                  </>
                )}
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

      <div className="mx-auto mt-12 max-w-5xl px-6">
        <section>
          <h2 className="text-lg font-semibold">Payment history</h2>
          <div className="mt-4">
            <BillingHistory />
          </div>
        </section>
      </div>

      {checkoutPlan && (
        <PaymentModal
          plan={checkoutPlan}
          prefill={prefillFromSessionUser(session?.user)}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => handleCheckoutSuccess(checkoutPlan)}
        />
      )}
    </div>
  );
}
