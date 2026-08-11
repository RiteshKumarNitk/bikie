"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { AccountTypeChangeRequestDTO } from "@bikie/types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  MORE_INFORMATION_REQUIRED: "More information requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/**
 * ADR-053 — "Account Type Request" (Profile → Help & Support). `accountType` is set once at
 * registration and only ever changed by an admin approving a request submitted here — this page
 * never switches the account itself.
 */
export default function AccountTypeRequestPage() {
  const { data: session } = authClient.useSession();
  const currentType = session?.user.accountType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
  const otherType = currentType === "SERVICE_PROVIDER" ? "RIDER" : "SERVICE_PROVIDER";

  const [requests, setRequests] = useState<AccountTypeChangeRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [supportingInfo, setSupportingInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/account-type-requests");
    if (res.ok) {
      const data: { requests: AccountTypeChangeRequestDTO[] } = await res.json();
      setRequests(data.requests ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const openRequest = requests.find((r) => r.status === "PENDING" || r.status === "MORE_INFORMATION_REQUIRED");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account-type-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedType: otherType,
          reason: reason.trim(),
          supportingInfo: supportingInfo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        if (data.error === "ALREADY_OPEN") {
          throw new Error("You already have a pending request — please wait for it to be reviewed.");
        }
        throw new Error(typeof data.error === "string" ? data.error : "Could not submit your request.");
      }
      setSubmitted(true);
      setReason("");
      setSupportingInfo("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Account Type Request</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Your BIKIE account is currently a <strong>{currentType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider"}</strong>{" "}
        account. Picked the wrong one at signup? Submit a request below and our team will review it — account type
        is never changed automatically.
      </p>

      {loading ? (
        <div className="mt-8 h-32 animate-pulse rounded-3xl bg-foreground/5" />
      ) : openRequest ? (
        <div className="mt-8 rounded-3xl bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Your request is being reviewed</p>
          <p className="mt-3 text-sm">
            {openRequest.currentType.replace("_", " ")} → {openRequest.requestedType.replace("_", " ")}
          </p>
          <p className="mt-1 text-sm text-foreground/60">{openRequest.reason}</p>
          <span className="mt-3 inline-block rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium">
            {STATUS_LABEL[openRequest.status] ?? openRequest.status}
          </span>
        </div>
      ) : submitted ? (
        <div className="mt-8 rounded-3xl bg-card p-6">
          <p className="text-sm">
            Your request has been submitted. We&apos;ll notify you once it&apos;s been reviewed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-card p-6">
          <div>
            <p className="text-sm font-medium">Requested account type</p>
            <p className="mt-1.5 rounded-xl border border-foreground/15 bg-foreground/[0.02] px-4 py-2.5 text-sm text-foreground/70">
              {otherType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="reason">
              Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              placeholder="e.g. I am a bike mechanic and accidentally registered as Rider."
              className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="supportingInfo">
              Supporting information <span className="font-normal text-foreground/50">(optional)</span>
            </label>
            <textarea
              id="supportingInfo"
              value={supportingInfo}
              onChange={(e) => setSupportingInfo(e.target.value)}
              rows={2}
              placeholder="Any additional context or links to documents"
              className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}

      {requests.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">Previous requests</p>
          <div className="mt-3 space-y-3">
            {requests
              .filter((r) => r.id !== openRequest?.id)
              .map((r) => (
                <div key={r.id} className="rounded-2xl border border-foreground/10 p-4 text-sm">
                  <p className="font-medium">
                    {r.currentType.replace("_", " ")} → {r.requestedType.replace("_", " ")} —{" "}
                    {STATUS_LABEL[r.status] ?? r.status}
                  </p>
                  <p className="mt-1 text-foreground/60">{r.reason}</p>
                  {r.adminRemarks && <p className="mt-1 text-foreground/50 text-xs">Admin: {r.adminRemarks}</p>}
                  <p className="mt-1 text-xs text-foreground/40">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
