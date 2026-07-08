"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@bikie/utils";
import { authClient } from "@/lib/auth-client";

export function BookingCard({
  bikeSlug,
  pricePerDay,
  securityDeposit,
}: {
  bikeSlug: string;
  pricePerDay: number;
  securityDeposit: number;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const subtotal = days * pricePerDay;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;

  function handleBook() {
    if (!session) {
      router.push(`/login?next=/bikes/${bikeSlug}`);
      return;
    }
    if (days <= 0) {
      setMessage("Choose valid pickup and return dates.");
      return;
    }
    setMessage("Booking confirmation is coming soon — this is a preview of the flow.");
  }

  return (
    <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
      <p className="text-2xl font-semibold">
        {formatCurrency(pricePerDay)}
        <span className="text-sm font-normal text-foreground/60"> / day</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Pickup</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Return</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {days > 0 && (
        <div className="mt-5 space-y-2 border-t border-foreground/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">
              {formatCurrency(pricePerDay)} × {days} day{days > 1 ? "s" : ""}
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Taxes</span>
            <span>{formatCurrency(taxes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Security deposit (refundable)</span>
            <span>{formatCurrency(securityDeposit)}</span>
          </div>
          <div className="flex justify-between border-t border-foreground/10 pt-2 font-semibold">
            <span>Total due at pickup</span>
            <span>{formatCurrency(total + securityDeposit)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        className="mt-5 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
      >
        Book Now
      </button>

      {message && <p className="mt-3 text-xs text-foreground/60">{message}</p>}
    </div>
  );
}
