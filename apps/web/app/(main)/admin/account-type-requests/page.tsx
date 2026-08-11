"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AccountTypeChangeRequestDTO } from "@bikie/types";

const STATUS_TABS = ["PENDING", "MORE_INFORMATION_REQUIRED", "APPROVED", "REJECTED", "ALL"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  MORE_INFORMATION_REQUIRED: "Info requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** ADR-053 — admin's queue of "I picked the wrong account type" support tickets. */
export default function AdminAccountTypeRequestsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("PENDING");
  const [requests, setRequests] = useState<AccountTypeChangeRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = tab === "ALL" ? "" : `?status=${tab}`;
    fetch(`/api/admin/account-type-requests${query}`)
      .then((res) => res.json())
      .then((data: { requests: AccountTypeChangeRequestDTO[] }) => setRequests(data.requests ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Account Type Requests</h1>
      <p className="mt-1 text-sm text-white/50">
        Users who picked the wrong account type at signup and asked to switch — every change goes through
        review here, never a self-service switch.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === s ? "bg-accent text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-white/5" />
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white/5 p-8 text-center text-sm text-white/50">
          No requests here.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/account-type-requests/${r.id}`} className="block">
                      <p className="font-medium text-accent-text hover:underline">{r.user.name}</p>
                      <p className="text-xs text-white/50">{r.user.phone ?? "—"}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.currentType.replace("_", " ")} → {r.requestedType.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-white/70">{r.reason}</td>
                  <td className="px-4 py-3 text-xs text-white/50">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
