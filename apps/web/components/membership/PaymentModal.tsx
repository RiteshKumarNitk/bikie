"use client";

import { useEffect, useState } from "react";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptReady: Promise<void> | null = null;

function loadRazorpayCheckout(): Promise<void> {
  if (razorpayScriptReady) return razorpayScriptReady;
  razorpayScriptReady = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptReady = null;
      reject(new Error("Failed to load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptReady;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * Two paths (ADR-043), decided server-side by `POST /api/membership/checkout`:
 *  - Razorpay configured: opens the real Razorpay Checkout modal against a server-created,
 *    server-priced order; on success, the payment is verified server-side (signature check)
 *    before membership activates — this component never decides "did the payment work," it
 *    only ever reports what Razorpay's own callback said and lets the backend be the judge.
 *  - Not configured (no live keys yet): falls back to the pre-existing simulated card form,
 *    completely unchanged, so local development and this environment (no Razorpay account set
 *    up yet) keep working exactly as before.
 */
export function PaymentModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [checkoutMode, setCheckoutMode] = useState<"loading" | "simulated" | "razorpay" | "unavailable">("loading");
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [status, setStatus] = useState<"form" | "processing" | "error">("form");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/membership/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.razorpayConfigured && data.order) {
          setRazorpayOrder(data.order);
          setCheckoutMode("razorpay");
        } else if (data.razorpayConfigured === false) {
          setCheckoutMode("simulated");
        } else {
          setCheckoutMode("unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setCheckoutMode("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [plan.id]);

  async function openRazorpay() {
    if (!razorpayOrder) return;
    setRazorpayError(null);
    try {
      await loadRazorpayCheckout();
    } catch {
      setRazorpayError("Couldn't load the payment form. Please check your connection and try again.");
      return;
    }
    if (!window.Razorpay) {
      setRazorpayError("Couldn't load the payment form. Please try again.");
      return;
    }

    const rzp = new window.Razorpay({
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.orderId,
      name: "BIKIE",
      description: `${plan.name} membership`,
      handler: async (response: RazorpaySuccessResponse) => {
        const res = await fetch("/api/membership/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        if (res.ok) {
          onSuccess();
        } else {
          setRazorpayError("Payment succeeded but couldn't be verified. Contact support with your payment ID.");
        }
      },
      modal: {
        ondismiss: () => {
          // User closed Razorpay's own modal without paying — just leave ours open so they can
          // retry, rather than closing behind them.
        },
      },
    });
    rzp.open();
  }

  const digitsOnly = cardNumber.replace(/\s/g, "");
  const isValid =
    digitsOnly.length >= 12 &&
    name.trim().length > 1 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    /^\d{3,4}$/.test(cvv);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setFormError("Please fill in all card details correctly.");
      return;
    }
    setFormError(null);
    setStatus("processing");

    await new Promise((resolve) => setTimeout(resolve, 1400));

    const paymentId = `DUMMY-${crypto.randomUUID()}`;
    const res = await fetch("/api/membership/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, paymentId }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      setStatus("form");
      setFormError("Payment could not be processed. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={status === "form" ? onClose : undefined}>
      <div
        className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {checkoutMode === "loading" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm font-medium">Preparing checkout…</p>
          </div>
        )}

        {checkoutMode === "unavailable" && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium">Checkout is unavailable right now</p>
            <p className="mt-1 text-xs text-foreground/50">Please try again in a moment.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl border border-foreground/15 px-4 py-2 text-sm hover:bg-foreground/5"
            >
              Close
            </button>
          </div>
        )}

        {checkoutMode === "razorpay" && (
          <div className="py-2 text-center">
            <p className="text-lg font-semibold">Secure Checkout</p>
            <p className="mt-1 text-sm text-foreground/50">
              {plan.name} · ₹{plan.price} / {plan.durationDays} days
            </p>
            <p className="mt-4 text-sm text-foreground/60">
              You&apos;ll be taken to Razorpay's secure payment window to complete this purchase.
            </p>
            {razorpayError && <p className="mt-3 text-xs text-red-400">{razorpayError}</p>}
            <button
              type="button"
              onClick={openRazorpay}
              className="mt-5 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              🔒 Pay ₹{plan.price} with Razorpay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        )}

        {checkoutMode === "simulated" &&
          (status === "processing" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-4 text-sm font-medium">Processing payment…</p>
              <p className="mt-1 text-xs text-foreground/40">Do not close this window</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Secure Checkout</p>
                <button type="button" onClick={onClose} className="text-foreground/40 hover:text-foreground">
                  ✕
                </button>
              </div>
              <p className="mt-1 text-sm text-foreground/50">
                {plan.name} · ₹{plan.price} / {plan.durationDays} days
              </p>

              <form onSubmit={handlePay} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground/60">Cardholder name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name on card"
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/60">Card number</label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground/60">Expiry</label>
                    <input
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/60">CVV</label>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                </div>

                {formError && <p className="text-xs text-red-400">{formError}</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  🔒 Pay ₹{plan.price} securely
                </button>
                <p className="text-center text-[11px] text-foreground/35">
                  Simulated checkout for demo purposes — no real charge is made.
                </p>
              </form>
            </>
          ))}
      </div>
    </div>
  );
}
