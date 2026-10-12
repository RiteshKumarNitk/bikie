"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LegalAcceptancePageDTO } from "@bikie/types";
import { LEGAL_TYPE_LABEL, fmtDateTime } from "./legal-labels";

const PAGE_SIZE = 25;

/** ADR-090 — every legal acceptance, newest first. Each row is an immutable record of one user
 * accepting one exact version; account type is the snapshot taken at acceptance time. */
export function ConsentRecordsBrowser() {
  const params = useSearchParams();
  const [data, setData] = useState<LegalAcceptancePageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [accountType, setAccountType] = useState(params.get("accountType") ?? "");
  const [documentType, setDocumentType] = useState(params.get("documentType") ?? "");
  const [version, setVersion] = useState(params.get("version") ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtersActive = !!(search || accountType || documentType || version || from || to);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) p.set("search", search);
    if (accountType) p.set("accountType", accountType);
    if (documentType) p.set("documentType", documentType);
    if (version) p.set("version", version);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [page, search, accountType, documentType, version, from, to]);

  // Reset to page 1 whenever a filter changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPage(1);
  }, [search, accountType, documentType, version, from, to]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/legal/acceptances?${queryString}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((body: LegalAcceptancePageDTO) => setData(body))
      .catch(() => setError("Could not load consent records. Please try again."))
      .finally(() => setLoading(false));
  }, [queryString]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const inputClass = "rounded-lg bg-white/10 px-2 py-2 text-sm text-white";

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-white/5 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user name / phone / email / user id"
          className="min-w-[240px] flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
        />
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={inputClass}>
          <option value="">All account types</option>
          <option value="RIDER">Rider</option>
          <option value="SERVICE_PROVIDER">Service Provider</option>
        </select>
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={inputClass}>
          <option value="">All documents</option>
          {Object.entries(LEGAL_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="Version"
          className={`${inputClass} w-24`}
        />
        <label className="flex items-center gap-1 text-xs text-white/50">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white" />
        </label>
        <label className="flex items-center gap-1 text-xs text-white/50">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white" />
        </label>
        {filtersActive && (
          <button
            onClick={() => {
              setSearch("");
              setAccountType("");
              setDocumentType("");
              setVersion("");
              setFrom("");
              setTo("");
            }}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/20"
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
      ) : data && data.acceptances.length === 0 ? (
        <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-white/50">
          {filtersActive ? "No consent records match these filters." : "No consent records yet."}
        </div>
      ) : data ? (
        <>
          <div className={`overflow-x-auto rounded-xl bg-white/5 ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Account type</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Accepted at</th>
                </tr>
              </thead>
              <tbody>
                {data.acceptances.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.userName}</p>
                      <p className="text-xs text-white/50">{a.userPhone ?? a.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.accountType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider"}</td>
                    <td className="px-4 py-3">{LEGAL_TYPE_LABEL[a.documentType]}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/legal/versions/${a.versionId}`} className="text-accent-text hover:underline">
                        v{a.versionNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60">{a.source === "SIGNUP" ? "Signup" : "Re-consent"}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{fmtDateTime(a.acceptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>
              {data.total.toLocaleString("en-IN")} record{data.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg bg-white/10 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-white/10 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
