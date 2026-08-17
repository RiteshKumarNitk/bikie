"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AccountTypeChangeRequestDTO } from "@bikie/types";

type Decision = "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED";

const ACTIONS: { decision: Decision; label: string; needsRemarks: boolean; danger?: boolean }[] = [
  { decision: "APPROVED", label: "Approve", needsRemarks: false },
  { decision: "MORE_INFORMATION_REQUIRED", label: "Request more information", needsRemarks: true },
  { decision: "REJECTED", label: "Reject", needsRemarks: true, danger: true },
];

/** ADR-053 — the one place an Account Type Change Request is decided. Approving atomically
 * flips the user's `accountType` server-side — this page never writes it directly. */
export default function AdminAccountTypeRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<AccountTypeChangeRequestDTO | null>(null);
  const [history, setHistory] = useState<AccountTypeChangeRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/account-type-requests/${id}`);
    if (res.ok) {
      const data: AccountTypeChangeRequestDTO = await res.json();
      setDetail(data);
      const historyRes = await fetch(`/api/admin/account-type-requests?status=ALL`);
      if (historyRes.ok) {
        const historyData: { requests: AccountTypeChangeRequestDTO[] } = await historyRes.json();
        setHistory(historyData.requests.filter((r) => r.userId === data.userId && r.id !== data.id));
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function decide(decision: Decision, decisionRemarks?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/account-type-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, adminRemarks: decisionRemarks }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(typeof data.error === "string" ? data.error : "Could not complete this action.");
      }
      setPendingDecision(null);
      setRemarks("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  if (!detail) return <div className="text-sm text-foreground/50">Request not found.</div>;

  const isOpen = detail.status === "PENDING" || detail.status === "MORE_INFORMATION_REQUIRED";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/account-type-requests" className="text-xs text-foreground/50 hover:underline">
            ← All requests
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{detail.user.name}</h1>
          <p className="text-sm text-foreground/50">{detail.user.phone ?? "No phone on file"}</p>
        </div>
        <span className="rounded-full bg-foreground/10 px-4 py-1.5 text-xs font-medium">
          {detail.status.replace(/_/g, " ")}
        </span>
      </div>

      <section className="rounded-3xl bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Requested change</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-foreground/50">Current account type (live)</p>
            <p>{detail.user.accountType.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-foreground/50">Requested</p>
            <p>{detail.requestedType.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-foreground/50">Submitted</p>
            <p>{new Date(detail.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-foreground/50">Last reviewed</p>
            <p>{detail.reviewedAt ? `${new Date(detail.reviewedAt).toLocaleString()} — ${detail.reviewedByName ?? "—"}` : "Not yet reviewed"}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-foreground/50 text-sm">Reason</p>
          <p className="mt-1 text-sm text-foreground/80">{detail.reason}</p>
        </div>
        {detail.supportingInfo && (
          <div className="mt-4">
            <p className="text-foreground/50 text-sm">Supporting information</p>
            <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{detail.supportingInfo}</p>
          </div>
        )}
        {detail.adminRemarks && (
          <div className="mt-4">
            <p className="text-foreground/50 text-sm">Admin remarks</p>
            <p className="mt-1 text-sm text-foreground/80">{detail.adminRemarks}</p>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="rounded-3xl bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Previous requests from this user</p>
          <div className="mt-3 space-y-3">
            {history.map((h) => (
              <div key={h.id} className="border-b border-foreground/10 pb-3 text-sm last:border-0 last:pb-0">
                <p className="font-medium">
                  {h.currentType.replace("_", " ")} → {h.requestedType.replace("_", " ")} — {h.status.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-foreground/60">{h.reason}</p>
                <p className="mt-1 text-xs text-foreground/40">{new Date(h.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOpen && (
        <section className="rounded-3xl bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Decision</p>
          {error && <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          <div className="mt-3 flex flex-wrap gap-3">
            {ACTIONS.map((a) =>
              a.needsRemarks ? (
                <button
                  key={a.decision}
                  type="button"
                  onClick={() => setPendingDecision(a.decision)}
                  disabled={busy}
                  className={`rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 ${
                    a.danger ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-foreground/10 hover:bg-foreground/15"
                  }`}
                >
                  {a.label}
                </button>
              ) : (
                <button
                  key={a.decision}
                  type="button"
                  onClick={() => decide(a.decision)}
                  disabled={busy}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy ? "Please wait…" : a.label}
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPendingDecision(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{ACTIONS.find((a) => a.decision === pendingDecision)?.label}</h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Remarks (shown to the user)"
              className="mt-4 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDecision(null)}
                className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remarks.trim() && decide(pendingDecision, remarks.trim())}
                disabled={!remarks.trim() || busy}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {busy ? "Please wait…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
