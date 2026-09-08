"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminRevenueReportDTO } from "@bikie/types";
import { formatCurrency } from "@bikie/utils";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
  { key: "custom", label: "Custom" },
] as const;

const ACCOUNT_COLORS: Record<string, string> = {
  RIDER: "#3b82f6",
  SERVICE_PROVIDER: "#e8a838",
};
const STATUS_COLORS: Record<string, string> = {
  PAID: "#22c55e",
  REFUNDED: "#ef4444",
};
const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "var(--color-foreground)",
};

function Card({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-gold/10 ring-1 ring-gold/30" : "bg-white/5"}`}>
      <p className="text-xs text-white/50">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${highlight ? "text-gold" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 backdrop-blur">
      <h3 className="mb-3 text-sm font-medium text-white/70">{title}</h3>
      {children}
    </div>
  );
}

const acctLabel = (t: string) => (t === "SERVICE_PROVIDER" ? "Service Provider" : "Rider");

export function RevenueReport() {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("last30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<AdminRevenueReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on any range/date change. setState only ever happens in the async callbacks below
  // (never synchronously in the effect body) — `loading` is nudged true by the controls instead.
  useEffect(() => {
    if (range === "custom" && (!from || !to)) return;
    let cancelled = false;
    const params = new URLSearchParams({ range });
    if (range === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    fetch(`/api/admin/reports?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { report: AdminRevenueReportDTO }) => {
        if (!cancelled) {
          setReport(data.report);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the report. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, from, to]);

  const empty =
    !!report && report.counts.paidInRange === 0 && report.counts.refundedInRange === 0 && report.timeSeries.length === 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => {
              setRange(r.key);
              if (r.key !== "custom") setLoading(true);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              range === r.key ? "bg-gold text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {r.label}
          </button>
        ))}
        {range === "custom" && (
          <span className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white"
            />
            <span className="text-white/40">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white"
            />
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-white/40">Loading report…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {report && !loading && !error && (
        <>
          {/* A. Revenue summary — rolling windows, range-independent */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card label="Total revenue" value={formatCurrency(report.revenue.total)} sub="all time" highlight />
            <Card label="Today" value={formatCurrency(report.revenue.today)} />
            <Card label="This week" value={formatCurrency(report.revenue.thisWeek)} sub="last 7 days" />
            <Card label="This month" value={formatCurrency(report.revenue.thisMonth)} />
            <Card label="This year" value={formatCurrency(report.revenue.thisYear)} />
            <Card
              label="Successful (all time)"
              value={String(report.counts.paidAllTime)}
              sub={`${report.refunds.count} refunded`}
            />
          </div>

          {empty ? (
            <Panel title="Selected period">
              <div className="flex h-[160px] items-center justify-center rounded-xl bg-white/5">
                <p className="text-sm text-white/40">No transactions found for this period.</p>
              </div>
            </Panel>
          ) : (
            <>
              {/* Range-scoped headline */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card label="Revenue (selected period)" value={formatCurrency(report.revenue.inRange)} highlight />
                <Card label="Successful payments" value={String(report.counts.paidInRange)} />
                <Card label="Refunds" value={formatCurrency(report.refunds.amount)} sub={`${report.refunds.count} refunded`} />
                <Card label="New memberships" value={String(report.memberships.newInRange)} />
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Revenue over time">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={report.timeSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                      <Line type="monotone" dataKey="revenue" stroke="#e8a838" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Transactions over time">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={report.timeSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Revenue by account type">
                  {report.byAccountType.length === 0 ? (
                    <EmptyBox />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={report.byAccountType.map((d) => ({ name: acctLabel(d.accountType), value: d.revenue, key: d.accountType }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={72}
                          label={({ name, value }) => `${name}: ${formatCurrency(Number(value))}`}
                        >
                          {report.byAccountType.map((d) => (
                            <Cell key={d.accountType} fill={ACCOUNT_COLORS[d.accountType] ?? "#6b7280"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Panel>
                <Panel title="Payment status distribution">
                  {report.byStatus.every((s) => s.count === 0) ? (
                    <EmptyBox />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={report.byStatus.filter((s) => s.count > 0).map((s) => ({ name: s.status, value: s.count }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={72}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {report.byStatus.filter((s) => s.count > 0).map((s) => (
                            <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#6b7280"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Panel>
              </div>

              {/* C. Revenue by account type — table */}
              <Panel title="Revenue by account type (selected period)">
                <MiniTable
                  head={["Account type", "Transactions", "Revenue"]}
                  rows={report.byAccountType.map((d) => [acctLabel(d.accountType), String(d.count), formatCurrency(d.revenue)])}
                  empty="No revenue in this period."
                />
              </Panel>

              {/* D. Revenue by plan */}
              <Panel title="Revenue by plan (selected period)">
                <MiniTable
                  head={["Plan", "Transactions", "Revenue"]}
                  rows={report.byPlan.map((d) => [d.planName, String(d.count), formatCurrency(d.revenue)])}
                  empty="No revenue in this period."
                />
              </Panel>

              {/* E. Payment status report */}
              <Panel title="Payment status report (selected period)">
                <MiniTable
                  head={["Status", "Count", "Amount"]}
                  rows={report.byStatus.map((s) => [s.status, String(s.count), formatCurrency(s.amount)])}
                  empty="No transactions in this period."
                />
                <p className="mt-2 text-[11px] text-white/35">
                  Only completed activations are recorded today (PAID / REFUNDED). Failed, pending and cancelled
                  Razorpay payments are not yet persisted — see the transaction-ledger follow-up.
                </p>
              </Panel>
            </>
          )}

          {/* B. Membership summary — always shown (live counts) */}
          <Panel title="Membership summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Card label="Active Rider" value={String(report.memberships.activeRider)} />
              <Card label="Active Service Provider" value={String(report.memberships.activeServiceProvider)} />
              <Card label="New (selected period)" value={String(report.memberships.newInRange)} />
              <Card label="Expired (selected period)" value={String(report.memberships.expiredInRange)} />
              <Card label="Expiring in 7 days" value={String(report.memberships.expiringSoon)} />
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl bg-white/5">
      <p className="text-sm text-white/30">No data for this period</p>
    </div>
  );
}

function MiniTable({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-white/40">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-white/40">
            {head.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-4 ${j === 0 ? "text-white/80" : "text-white/60"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
