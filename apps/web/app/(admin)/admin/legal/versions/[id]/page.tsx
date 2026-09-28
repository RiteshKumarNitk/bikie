"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { LegalVersionDetailDTO } from "@bikie/types";
import { LegalContent } from "@/components/legal/LegalContent";
import { StatusPill, fmtDateTime } from "@/components/admin/legal/legal-labels";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

/** ADR-090 — one legal version. Published/archived versions are read-only forever (the database
 * rejects edits too). A DRAFT gets the editor: edit → preview → save → publish. */
export default function AdminLegalVersionPage() {
  const id = useParams<{ id: string }>().id;
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [version, setVersion] = useState<LegalVersionDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<"save" | "publish" | "discard" | null>(null);

  const load = useCallback(
    () =>
      fetch(`/api/admin/legal/versions/${id}`)
        .then((res) => (res.ok ? (res.json() as Promise<LegalVersionDetailDTO>) : null))
        .then((data) => {
          setVersion(data);
          if (data) setContent(data.content);
        })
        .finally(() => setLoading(false)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const isDraft = version?.status === "DRAFT";
  const dirty = isDraft && content !== version?.content;

  async function request(path: string, init: RequestInit, fallback: string) {
    const res = await fetch(path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : fallback);
    return data;
  }

  async function saveDraft() {
    setBusy("save");
    try {
      const data: LegalVersionDetailDTO = await request(
        `/api/admin/legal/versions/${id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) },
        "Could not save the draft.",
      );
      setVersion(data);
      toast.success("Draft saved");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the draft.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!version || !content.trim()) {
      toast.error("A version with no content can't be published.");
      return;
    }
    const ok = await confirm(
      `Publish v${version.versionNumber}?`,
      `It becomes the current ${version.title} immediately and can never be edited. The previous version is archived. New signups must accept it; existing users keep their record of the version they accepted.`,
    );
    if (!ok) return;
    if (dirty && !(await saveDraft())) return;
    setBusy("publish");
    try {
      await request(`/api/admin/legal/versions/${id}/publish`, { method: "POST" }, "Could not publish this version.");
      toast.success(`v${version.versionNumber} published`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish this version.");
    } finally {
      setBusy(null);
    }
  }

  async function discard() {
    if (!version) return;
    const ok = await confirm(`Discard draft v${version.versionNumber}?`, "The draft text is deleted. Published versions are not affected.");
    if (!ok) return;
    setBusy("discard");
    try {
      await request(`/api/admin/legal/versions/${id}`, { method: "DELETE" }, "Could not discard the draft.");
      toast.success("Draft discarded");
      router.push(`/admin/legal/${version.type}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not discard the draft.");
      setBusy(null);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  if (!version) return <div className="text-sm text-white/50">Version not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {dialog}
      <div>
        <Link href={`/admin/legal/${version.type}`} className="text-xs text-white/50 hover:underline">
          ← {version.title} history
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {version.title} — v{version.versionNumber}
          </h1>
          <StatusPill status={version.status} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-3xl bg-card p-6 text-sm md:grid-cols-4">
        <div>
          <p className="text-white/50">Created</p>
          <p>{fmtDateTime(version.createdAt)}</p>
          {version.createdByName && <p className="text-xs text-white/40">by {version.createdByName}</p>}
        </div>
        <div>
          <p className="text-white/50">Published</p>
          <p>{fmtDateTime(version.publishedAt)}</p>
          {version.publishedByName && <p className="text-xs text-white/40">by {version.publishedByName}</p>}
        </div>
        <div>
          <p className="text-white/50">{version.status === "ARCHIVED" ? "Archived" : "Last edited"}</p>
          <p>{fmtDateTime(version.status === "ARCHIVED" ? version.archivedAt : version.updatedAt)}</p>
        </div>
        <div>
          <p className="text-white/50">Accepted by</p>
          <p>
            {version.acceptanceCount.toLocaleString("en-IN")} users
            {version.acceptanceCount > 0 && (
              <Link
                href={`/admin/legal/acceptances?documentType=${version.type}&version=${version.versionNumber}`}
                className="ml-2 text-xs text-accent-text hover:underline"
              >
                View
              </Link>
            )}
          </p>
        </div>
      </section>

      {isDraft ? (
        <section className="rounded-3xl bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["edit", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                    tab === t ? "bg-accent text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {t === "edit" ? "Edit" : "Preview"}
                </button>
              ))}
            </div>
            {dirty && <span className="text-xs text-amber-300">Unsaved changes</span>}
          </div>

          {tab === "edit" ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                spellCheck
                className="mt-4 w-full rounded-xl bg-white/5 p-4 font-mono text-sm leading-relaxed text-white outline-none focus:ring-1 focus:ring-accent/40"
              />
              <p className="mt-2 text-xs text-white/40">
                Plain text. Start a line with <code># </code> for a section heading or <code>## </code> for a clause
                heading; leave a blank line between paragraphs.
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-white/5 p-6">
              <LegalContent content={content} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={discard}
              disabled={busy !== null}
              className="rounded-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {busy === "discard" ? "Discarding…" : "Discard draft"}
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy !== null || !dirty}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={busy !== null || !content.trim()}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "publish" ? "Publishing…" : `Publish v${version.versionNumber}`}
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-card p-6">
          <p className="mb-4 text-xs text-white/40">
            This version is {version.status.toLowerCase()} and immutable — its text can never change. To revise it,
            create a new version from the overview.
          </p>
          <LegalContent content={version.content} />
        </section>
      )}
    </div>
  );
}
