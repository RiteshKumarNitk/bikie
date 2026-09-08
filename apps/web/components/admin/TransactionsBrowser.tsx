"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminTransactionDTO } from "@bikie/types";
import { formatCurrency } from "@bikie/utils";

type Facets = { plans: { planId: string; planName: string }[] };

const PAGE_SIZE = 25;

const acctLabel = (t: string) => (t === "SERVICE_PROVIDER" ? "Service Provider" : "Rider");

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export function TransactionsBrowser() {
  const [rows, setRows] = useState<AdminTransactionDTO[]>([]);
  const [facets, setFacets] = useState<Facets>({ plans: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminTransactionDTO | null>(null);

  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("");
  const [status, setStatus] = useState("");
  const [planId, setPlanId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const filtersActive = !!(search || accountType || status || planId || from || to);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort });
    if (search) p.set("search", search);
    if (accountType) p.set("accountType", accountType);
    if (status) p.set("status", status);
    if (planId) p.set("planId", planId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [page, sort, search, accountType, status, planId, from, to]);

  // Reset to page 1 whenever a filter changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPage(1);
  }, [search, accountType, status, planId, from, to, sort]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/transactions?${queryString}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { transactions: AdminTransactionDTO[]; total: number; facets: Facets }) => {
        setRows(data.transactions);
        setTotal(data.total);
        setFacets(data.facets);
      })
      .catch(() => setError("Could not load transactions. Please try again."))
      .finally(() => setLoading(false));
  }, [queryString]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mt-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-white/5 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / phone / payment or order id / receipt"
          className="min-w-[260px] flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
        />
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="rounded-lg bg-white/10 px-2 py-2 text-sm text-white">
          <option value="">All account types</option>
          <option value="RIDER">Rider</option>
          <option value="SERVICE_PROVIDER">Service Provider</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg bg-white/10 px-2 py-2 text-sm text-white">
          <option value="">All statuses</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="rounded-lg bg-white/10 px-2 py-2 text-sm text-white">
          <option value="">All plans</option>
          {facets.plans.map((p) => (
            <option key={p.planId} value={p.planId}>
              {p.planName}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-white/50">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white" />
        </label>
        <label className="flex items-center gap-1 text-xs text-white/50">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")} className="rounded-lg bg-white/10 px-2 py-2 text-sm text-white">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        {filtersActive && (
          <button
            onClick={() => {
              setSearch("");
              setAccountType("");
              setStatus("");
              setPlanId("");
              setFrom("");
              setTo("");
            }}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/20"
          >
            Clear
          </button>
        )}
        <a
          href={`/api/admin/transactions/export?${queryString}`}
          className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-black hover:bg-gold/90"
        >
          Export CSV
        </a>
      </div>

      <p className="text-xs text-white/40">
        {loading ? "Loading…" : `${total} transaction${total === 1 ? "" : "s"}`}
        {filtersActive ? " matching filters" : ""}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && rows.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center rounded-2xl bg-white/5">
          <p className="text-sm text-white/40">
            {filtersActive ? "No transactions match these filters." : "No transactions found yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white/5">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Razorpay Payment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="cursor-pointer border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{t.receiptNo}</td>
                  <td className="px-4 py-3 text-white/60">{fmtDateTime(t.paidAt)}</td>
                  <td className="px-4 py-3 text-white/70">{acctLabel(t.accountType)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white/80">{t.customerName}</span>
                    {t.customerPhone && <span className="block text-xs text-white/40">{t.customerPhone}</span>}
                  </td>
                  <td className="px-4 py-3 text-white/70">{t.planName}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {t.amount === 0 ? "Free" : formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        t.status === "PAID" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{t.razorpayPaymentId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-white/40">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {selected && <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-white/40">{label}</span>
      <span className={`text-right text-white/80 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function TransactionDrawer({ tx, onClose }: { tx: AdminTransactionDTO; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">Transaction</p>
            <p className="font-mono text-xs text-white/50">{tx.receiptNo}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-4">
          <Row label="Status" value={tx.status} />
          <Row label="Amount" value={tx.amount === 0 ? "Free" : `${formatCurrency(tx.amount)} (${tx.currency})`} />
          <Row label="Account type" value={acctLabel(tx.accountType)} />
          <Row label="Customer" value={tx.customerName} />
          <Row label="Mobile" value={tx.customerPhone ?? "—"} />
          <Row label="Plan" value={tx.planName} />
          <Row label="Payment date" value={fmtDateTime(tx.paidAt)} />
          <Row label="Membership start" value={fmtDate(tx.membershipStartDate)} />
          <Row label="Membership expiry" value={fmtDate(tx.membershipEndDate)} />
          <Row label="Duration" value={`${tx.durationDays} days`} />
          <Row label="Razorpay payment id" value={tx.razorpayPaymentId ?? "—"} mono />
          <Row label="Razorpay order id" value={tx.razorpayOrderId ?? "—"} mono />
          <Row label="Payment reference" value={tx.paymentId ?? "—"} mono />
          <Row label="Invoice / receipt no" value={tx.receiptNo} mono />
          <Row label="Confirmation SMS" value={tx.confirmationSmsSentAt ? fmtDateTime(tx.confirmationSmsSentAt) : "not sent"} />
          <Row label="User id" value={tx.userId} mono />
          <Row label="Recorded at" value={fmtDateTime(tx.createdAt)} />
        </div>
      </div>
    </div>
  );
}
