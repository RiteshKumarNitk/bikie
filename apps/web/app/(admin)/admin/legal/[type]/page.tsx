"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LegalDocumentTypeDTO, LegalVersionSummaryDTO } from "@bikie/types";
import { LEGAL_TYPE_LABEL, StatusPill, fmtDateTime } from "@/components/admin/legal/legal-labels";
import { useCreateLegalVersion } from "@/components/admin/legal/useCreateLegalVersion";

/** ADR-090 — every version of one document, newest first. Nothing here is ever deleted except an
 * unpublished draft; archived versions stay viewable for audit. */
export default function AdminLegalHistoryPage() {
  const type = useParams<{ type: string }>().type as LegalDocumentTypeDTO;
  const [versions, setVersions] = useState<LegalVersionSummaryDTO[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { create, creating } = useCreateLegalVersion();

  useEffect(() => {
    fetch(`/api/admin/legal/${type}/versions`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: { versions: LegalVersionSummaryDTO[] } | null) => data && setVersions(data.versions));
  }, [type]);

  if (notFound) return <div className="text-sm text-white/50">Unknown document type.</div>;

  const draft = versions?.find((v) => v.status === "DRAFT");

  return (
    <div>
      <Link href="/admin/legal" className="text-xs text-white/50 hover:underline">
        ← Legal overview
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{LEGAL_TYPE_LABEL[type] ?? type} — version history</h1>
        {draft ? (
          <Link
            href={`/admin/legal/versions/${draft.id}`}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Continue draft v{draft.versionNumber}
          </Link>
        ) : (
          <button
            type="button"
            disabled={creating !== null}
            onClick={() => create(type)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create New Version"}
          </button>
        )}
      </div>

      {!versions ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-white/5" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Archived</th>
                <th className="px-4 py-3 text-right">Accepted by</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/legal/versions/${v.id}`} className="font-medium text-accent-text hover:underline">
                      v{v.versionNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {fmtDateTime(v.createdAt)}
                    {v.createdByName && <span className="block text-white/40">by {v.createdByName}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {fmtDateTime(v.publishedAt)}
                    {v.publishedByName && <span className="block text-white/40">by {v.publishedByName}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">{fmtDateTime(v.archivedAt)}</td>
                  <td className="px-4 py-3 text-right">{v.acceptanceCount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
