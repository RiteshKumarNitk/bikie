"use client";

import { useEffect, useState } from "react";
import type { InvoiceSummaryDTO } from "@bikie/types";

/** ADR-070 — the signed-in user's own membership payment/invoice history. Reads
 * `GET /api/billing/history` (always scoped to the session user); "View receipt" opens the
 * server-rendered printable HTML for that invoice in a new tab. Works unchanged for both
 * account types. */
export function BillingHistory() {
  const [invoices, setInvoices] = useState<InvoiceSummaryDTO[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/history")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { invoices: InvoiceSummaryDTO[] }) => {
        if (!cancelled) setInvoices(data.invoices ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="text-sm text-foreground/50">Couldn&apos;t load your payment history right now.</p>
    );
  }
  if (invoices === null) {
    return <div className="h-24 animate-pulse rounded-2xl bg-card" />;
  }
  if (invoices.length === 0) {
    return <p className="text-sm text-foreground/50">No membership payments yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-foreground/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/40">
            <th className="px-4 py-3 font-medium">Receipt</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-foreground/5 last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{inv.receiptNo}</td>
              <td className="px-4 py-3">{inv.planName}</td>
              <td className="px-4 py-3 text-foreground/60">
                {new Date(inv.paidAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {inv.currency === "INR" ? "₹" : `${inv.currency} `}
                {inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.status === "PAID"
                      ? "bg-success/15 text-success"
                      : "bg-foreground/10 text-foreground/60"
                  }`}
                >
                  {inv.status === "PAID" ? "Paid" : "Refunded"}
                </span>
              </td>
              <td className="px-4 py-3">
                <a
                  href={`/api/billing/invoices/${inv.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-text hover:underline"
                >
                  View receipt
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
