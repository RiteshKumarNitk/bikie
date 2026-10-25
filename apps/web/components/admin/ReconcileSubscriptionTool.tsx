"use client";

import { useState } from "react";

interface ReconcileResult {
  membership: { id: string; endDate: string; subscriptionStatus: string | null };
  invoicesFound: number;
}

/**
 * Manual safety net for when Razorpay's `subscription.charged`/`subscription.activated` webhook
 * never reaches BIKIE — webhooks are best-effort delivery, not a guarantee, so a Service Provider
 * can be genuinely charged and have an active mandate on Razorpay's side while BIKIE never finds
 * out. Takes the Razorpay Subscription id (visible in the Razorpay Dashboard URL for that
 * subscription, or on the SP's own Razorpay "Set AutoPay" confirmation screen) and replays every
 * paid invoice Razorpay has recorded against it through the exact same code path the webhook
 * itself uses — idempotent, so running it on an already-up-to-date subscription, or running it
 * twice, is always a safe no-op.
 */
export function ReconcileSubscriptionTool({ onReconciled }: { onReconciled?: () => void }) {
  const [open, setOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!subscriptionId.trim()) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/partner-membership/subscriptions/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpaySubscriptionId: subscriptionId.trim() }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        const messages: Record<string, string> = {
          NOT_FOUND: "No BIKIE membership has this Razorpay subscription id — double-check it against the Razorpay Dashboard.",
          COULD_NOT_VERIFY: "Could not reach Razorpay to verify this subscription's live state. Try again shortly.",
        };
        throw new Error(messages[data.error as string] ?? "Could not reconcile this subscription. Please try again.");
      }
      setResult(data as ReconcileResult);
      onReconciled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    setSubscriptionId("");
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/20"
      >
        Sync Subscription from Razorpay
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-white">Sync Subscription from Razorpay</p>
            <p className="mt-1 text-sm text-white/50">
              Use this when a Service Provider&apos;s Razorpay mandate/payment succeeded (their autopay screen shows
              &quot;active&quot; with a real next-due date) but nothing shows up here — the webhook that tells BIKIE
              about a charge may not have arrived. Paste the Razorpay Subscription id (from the Razorpay Dashboard
              URL for this subscription) to pull its real payment history directly.
            </p>

            <label className="mt-4 block text-xs font-medium text-white/60" htmlFor="razorpay-subscription-id">
              Razorpay Subscription id
            </label>
            <input
              id="razorpay-subscription-id"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="sub_XXXXXXXXXXXXXX"
              className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
            />

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            {result && (
              <div className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                <p className="font-medium">
                  {result.invoicesFound === 0
                    ? "Nothing new to record — this subscription had no paid invoices on Razorpay's side yet, but its status was synced."
                    : `Recorded ${result.invoicesFound} paid invoice${result.invoicesFound === 1 ? "" : "s"} from Razorpay.`}
                </p>
                <p className="mt-1 text-white/70">
                  Membership now valid until {new Date(result.membership.endDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white">
                Close
              </button>
              <button
                onClick={submit}
                disabled={submitting || !subscriptionId.trim()}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold/90 disabled:opacity-50"
              >
                {submitting ? "Syncing…" : "Sync"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
