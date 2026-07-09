"use client";

import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function PaymentModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [status, setStatus] = useState<"form" | "processing" | "error">("form");
  const [formError, setFormError] = useState<string | null>(null);

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
        {status === "processing" ? (
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
        )}
      </div>
    </div>
  );
}
