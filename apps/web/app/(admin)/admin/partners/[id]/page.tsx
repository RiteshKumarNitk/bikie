"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AdminPartnerDetailDTO } from "@bikie/types";
import { partnerTypes } from "@/components/auth/PartnerBusinessFields";

type Action = "APPROVE" | "REJECT" | "REQUEST_INFO" | "SUSPEND" | "RESTORE";

const ACTIONS_BY_STATUS: Record<string, { action: Action; label: string; needsReason: boolean; danger?: boolean }[]> = {
  PENDING_VERIFICATION: [
    { action: "APPROVE", label: "Approve", needsReason: false },
    { action: "REQUEST_INFO", label: "Request more information", needsReason: true },
    { action: "REJECT", label: "Reject", needsReason: true, danger: true },
  ],
  MORE_INFORMATION_REQUIRED: [{ action: "REJECT", label: "Reject", needsReason: true, danger: true }],
  APPROVED: [{ action: "SUSPEND", label: "Suspend", needsReason: true, danger: true }],
  SUSPENDED: [{ action: "RESTORE", label: "Restore", needsReason: false }],
};

/** ADR-046b — the admin verification-review screen: applicant/user info, photos/documents,
 * decision history (`AuditLog`), and the state-appropriate action set. */
export default function AdminPartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<AdminPartnerDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/partners/${id}`);
    if (res.ok) {
      const data: AdminPartnerDetailDTO = await res.json();
      setDetail(data);
      setCategory(data.profile.type);
    }
    setLoading(false);
  }

  async function saveCategory() {
    setCategoryBusy(true);
    setCategoryError(null);
    try {
      const res = await fetch(`/api/admin/partners/${id}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: category }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(typeof data.error === "string" ? data.error : "Could not update the category.");
      }
      await load();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCategoryBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAction(action: Action, actionReason?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: actionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(typeof data.error === "string" ? data.error : "Could not complete this action.");
      }
      setPendingAction(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  if (!detail) return <div className="text-sm text-foreground/50">Partner not found.</div>;

  const { profile, owner, history } = detail;
  const actions = ACTIONS_BY_STATUS[profile.verificationStatus] ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/partners" className="text-xs text-foreground/50 hover:underline">← All partners</Link>
          <h1 className="mt-1 text-2xl font-semibold">{profile.businessName}</h1>
          <p className="text-sm text-foreground/50">{profile.type.replace(/_/g, " ")} · {profile.city}</p>
        </div>
        <span className="rounded-full bg-foreground/10 px-4 py-1.5 text-xs font-medium">{profile.verificationStatus.replace(/_/g, " ")}</span>
      </div>

      <section className="rounded-3xl bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Applicant</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-foreground/50">Name</p><p>{owner.name}</p></div>
          <div><p className="text-foreground/50">Email</p><p>{owner.email}</p></div>
          <div><p className="text-foreground/50">Phone</p><p>{owner.phone ?? "—"}</p></div>
          <div><p className="text-foreground/50">Account created</p><p>{new Date(owner.createdAt).toLocaleDateString()}</p></div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Business profile</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-foreground/50">Address</p><p>{[profile.addressLine, profile.area, profile.pincode].filter(Boolean).join(", ") || "—"}</p></div>
          <div><p className="text-foreground/50">Government ID</p><p>{profile.governmentIdType ? `${profile.governmentIdType} · ${profile.governmentIdNumber}` : "—"}</p></div>
          <div><p className="text-foreground/50">Contact person 1</p><p>{profile.contactPerson1Name ? `${profile.contactPerson1Name} (${profile.contactPerson1Mobile})` : "—"}</p></div>
          <div><p className="text-foreground/50">Contact person 2</p><p>{profile.contactPerson2Name ? `${profile.contactPerson2Name} (${profile.contactPerson2Mobile})` : "—"}</p></div>
          <div><p className="text-foreground/50">Submitted</p><p>{profile.submittedAt ? new Date(profile.submittedAt).toLocaleString() : "Not yet submitted"}</p></div>
          <div><p className="text-foreground/50">Last reviewed</p><p>{profile.reviewedAt ? new Date(profile.reviewedAt).toLocaleString() : "—"}</p></div>
        </div>
        {profile.description && <p className="mt-4 text-sm text-foreground/70">{profile.description}</p>}
        {(profile.profilePhotoUrl || profile.shopPhotoUrls.length > 0 || profile.identityDocumentUrl || profile.businessDocumentUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {profile.profilePhotoUrl && <a href={profile.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-text underline">Profile photo</a>}
            {profile.identityDocumentUrl && <a href={profile.identityDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-text underline">Identity document</a>}
            {profile.businessDocumentUrl && <a href={profile.businessDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-text underline">Business document</a>}
            {profile.shopPhotoUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-text underline">Shop photo {i + 1}</a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Category</p>
        {categoryError && <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{categoryError}</div>}
        <div className="mt-3 flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
          >
            {partnerTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveCategory}
            disabled={categoryBusy || category === profile.type}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {categoryBusy ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      {actions.length > 0 && (
        <section className="rounded-3xl bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Decision</p>
          {error && <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          <div className="mt-3 flex flex-wrap gap-3">
            {actions.map((a) =>
              a.needsReason ? (
                <button
                  key={a.action}
                  type="button"
                  onClick={() => setPendingAction(a.action)}
                  disabled={busy}
                  className={`rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 ${a.danger ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-foreground/10 hover:bg-foreground/15"}`}
                >
                  {a.label}
                </button>
              ) : (
                <button
                  key={a.action}
                  type="button"
                  onClick={() => runAction(a.action)}
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

      <section className="rounded-3xl bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Verification history</p>
        <div className="mt-3 space-y-3">
          {history.length === 0 && <p className="text-sm text-foreground/50">No decisions yet.</p>}
          {history.map((h) => (
            <div key={h.id} className="border-b border-foreground/10 pb-3 text-sm last:border-0 last:pb-0">
              <p className="font-medium">{h.action.replace(/_/g, " ")}{h.actorName && ` — ${h.actorName}`}</p>
              {h.metadata && typeof h.metadata.reason === "string" && (
                <p className="mt-1 text-foreground/60">{h.metadata.reason}</p>
              )}
              <p className="mt-1 text-xs text-foreground/40">{new Date(h.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPendingAction(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{ACTIONS_BY_STATUS[profile.verificationStatus]?.find((a) => a.action === pendingAction)?.label}</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason (shown to the applicant)"
              className="mt-4 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setPendingAction(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5">Cancel</button>
              <button
                type="button"
                onClick={() => reason.trim() && runAction(pendingAction, reason.trim())}
                disabled={!reason.trim() || busy}
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
