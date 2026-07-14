"use client";

import { useState } from "react";
import type { ReportReason, ReportTargetType } from "@bikie/types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse" },
  { value: "FAKE_ACCOUNT", label: "Fake account" },
  { value: "DANGEROUS_BEHAVIOUR", label: "Dangerous behaviour" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "SCAM", label: "Scam" },
  { value: "OTHER", label: "Other" },
];

export function ReportModal({
  targetType,
  targetId,
  title = "Report",
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  title?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"form" | "submitting" | "done" | "error">("form");

  async function submit() {
    setStatus("submitting");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() || undefined }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "done" ? (
          <div className="py-4 text-center">
            <p className="text-lg font-semibold">Report submitted</p>
            <p className="mt-2 text-sm text-foreground/60">
              Thanks for flagging this — our moderation team will take a look.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">{title}</p>
              <button type="button" onClick={onClose} className="text-foreground/40 hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground/60">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground/60">Details (optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything else moderators should know…"
                  className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-400">Couldn&apos;t submit your report. Please try again.</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={status === "submitting"}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {status === "submitting" ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
