"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LegalDocumentOverviewDTO } from "@bikie/types";
import { LEGAL_TYPE_LABEL, StatusPill, fmtDate } from "@/components/admin/legal/legal-labels";
import { useCreateLegalVersion } from "@/components/admin/legal/useCreateLegalVersion";

/** ADR-090 — Admin → Legal: the currently published version of each legal document. The only
 * place legal text is managed (the mobile app has no admin surface). Editing always means a new
 * version: Create → edit draft → preview → publish. */
export default function AdminLegalPage() {
  const [documents, setDocuments] = useState<LegalDocumentOverviewDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { create, creating } = useCreateLegalVersion();

  useEffect(() => {
    fetch("/api/admin/legal")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { documents: LegalDocumentOverviewDTO[] }) => setDocuments(data.documents))
      .catch(() => setError("Could not load legal documents. Please refresh."));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Legal / Terms Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Published versions are immutable. To change a document, create a new version — users keep their record of
            the exact version they accepted.
          </p>
        </div>
        <Link
          href="/admin/legal/acceptances"
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
        >
          Consent records →
        </Link>
      </div>

      {error && <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {!documents && !error ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : documents && documents.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white/5 p-8 text-center text-sm text-white/50">
          No legal documents exist yet — run the database migrations.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {documents?.map((doc) => (
            <section key={doc.id} className="flex flex-col rounded-3xl bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{doc.title}</h2>
                {doc.currentVersion ? <StatusPill status="PUBLISHED" /> : <span className="text-xs text-white/40">Not published</span>}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-white/50">Current version</dt>
                  <dd className="font-medium">{doc.currentVersion ? `v${doc.currentVersion.versionNumber}` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Accepted by</dt>
                  <dd className="font-medium">
                    {doc.currentVersion ? `${doc.currentVersion.acceptanceCount.toLocaleString("en-IN")} users` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">Published</dt>
                  <dd>{fmtDate(doc.currentVersion?.publishedAt ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Last updated</dt>
                  <dd>{fmtDate(doc.lastUpdatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Total versions</dt>
                  <dd>{doc.versionCount}</dd>
                </div>
              </dl>

              {doc.draft && (
                <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  Draft v{doc.draft.versionNumber} in progress · edited {fmtDate(doc.draft.updatedAt)}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {doc.currentVersion && (
                  <Link
                    href={`/admin/legal/versions/${doc.currentVersion.id}`}
                    className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/admin/legal/${doc.type}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
                >
                  History
                </Link>
                {doc.draft ? (
                  <Link
                    href={`/admin/legal/versions/${doc.draft.id}`}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover"
                  >
                    Continue draft v{doc.draft.versionNumber}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={creating !== null}
                    onClick={() => create(doc.type)}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {creating === doc.type ? "Creating…" : "Create New Version"}
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-white/40">
        Documents: {Object.values(LEGAL_TYPE_LABEL).join(" · ")}. New signups must accept the current version of each.
      </p>
    </div>
  );
}
