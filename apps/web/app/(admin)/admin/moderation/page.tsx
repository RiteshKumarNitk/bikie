"use client";

import { Fragment, useEffect, useState } from "react";
import type { ReportDTO, ReportStatus, ReportTargetType, ModerationConversationSummaryDTO } from "@bikie/types";
import { useToast } from "@/components/ui/Toast";

const REPORT_STATUSES: ReportStatus[] = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"];
const TARGET_TYPES: ReportTargetType[] = ["MESSAGE", "USER", "TRIP", "CONVERSATION", "GROUP"];

type UserAction = "WARN" | "MUTE" | "SUSPEND" | "BAN" | "RESTORE";

const USER_ACTION_LABEL: Record<UserAction, string> = {
  WARN: "Warn",
  MUTE: "Mute",
  SUSPEND: "Suspend",
  BAN: "Ban",
  RESTORE: "Restore",
};

interface UserActionModalState {
  report: ReportDTO;
  action: UserAction;
}

interface ConversationActionModalState {
  conversation: ModerationConversationSummaryDTO;
  action: "LOCK" | "UNLOCK" | "DELETE";
}

export default function AdminModerationPage() {
  const [tab, setTab] = useState<"reports" | "conversations">("reports");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Moderation</h1>
      <p className="mt-1 text-sm text-white/50">
        Trust &amp; safety: review user reports and take action, or manage locked/flagged Ride Room conversations.
      </p>

      <div className="mt-5 flex gap-2 border-b border-foreground/10">
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "reports" ? "border-accent text-foreground" : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          Reports
        </button>
        <button
          type="button"
          onClick={() => setTab("conversations")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "conversations" ? "border-accent text-foreground" : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          Conversations
        </button>
      </div>

      {tab === "reports" ? <ReportsQueue /> : <ConversationsQueue />}
    </div>
  );
}

function ReportsQueue() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<ReportTargetType | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userActionModal, setUserActionModal] = useState<UserActionModalState | null>(null);
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  // Fetched once on mount; status/target-type filters are applied client-side (same
  // pattern as the Bookings/Users admin pages) so changing a filter never needs to
  // re-trigger a fetch from inside an effect.
  useEffect(() => {
    fetch("/api/admin/moderation/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports ?? []);
        setLoading(false);
      });
  }, []);

  const visibleReports = reports.filter(
    (r) => (!statusFilter || r.status === statusFilter) && (!targetTypeFilter || r.targetType === targetTypeFilter),
  );

  async function updateReportStatus(id: string, status: ReportStatus, resolutionNote?: string) {
    const res = await fetch(`/api/admin/moderation/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolutionNote }),
    });
    if (!res.ok) {
      toast.error("Unable to complete the request. Please try again.");
      return;
    }
    const data = await res.json();
    if (data.report) {
      setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
      toast.success("Report updated successfully");
    }
  }

  function openUserAction(report: ReportDTO, action: UserAction) {
    setUserActionModal({ report, action });
    setReason("");
    setDurationHours(24);
    setActionError(null);
  }

  async function submitUserAction() {
    if (!userActionModal) return;
    const { report, action } = userActionModal;
    if (!reason.trim() && action !== "RESTORE") {
      setActionError("A reason is required.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    const path =
      action === "WARN" ? "warn" : action === "MUTE" ? "mute" : action === "SUSPEND" ? "suspend" : action === "BAN" ? "ban" : "restore";
    const body: Record<string, unknown> = { reason: reason.trim() || "Restored by admin", reportId: report.id };
    if (action === "MUTE" || action === "SUSPEND") body.durationHours = durationHours;

    const res = await fetch(`/api/admin/moderation/users/${report.targetId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.error ? JSON.stringify(data.error) : "Action failed";
      setActionError(message);
      toast.error(message);
      setSubmitting(false);
      return;
    }
    // Mark the report resolved once an action has been taken against its target.
    await updateReportStatus(report.id, "RESOLVED", `${USER_ACTION_LABEL[action]} applied to user`);
    setSubmitting(false);
    setUserActionModal(null);
  }

  async function deleteReportedMessage(report: ReportDTO) {
    const noteReason = window.prompt("Reason for deleting this message?", "Violates community guidelines");
    if (!noteReason) return;
    const res = await fetch(`/api/admin/moderation/messages/${report.targetId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: noteReason, reportId: report.id }),
    });
    if (!res.ok) {
      toast.error("Unable to delete this message. Please try again.");
      return;
    }
    await updateReportStatus(report.id, "RESOLVED", "Message deleted");
  }

  async function lockReportedConversation(report: ReportDTO, locked: boolean) {
    const noteReason = window.prompt(locked ? "Reason for locking this conversation?" : "Reason for unlocking?", "Reported content");
    if (!noteReason) return;
    const res = await fetch(`/api/admin/moderation/conversations/${report.targetId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked, reason: noteReason }),
    });
    if (!res.ok) {
      toast.error("Unable to complete the request. Please try again.");
      return;
    }
    await updateReportStatus(report.id, "RESOLVED", locked ? "Conversation locked" : "Conversation unlocked");
  }

  if (loading) return <div className="mt-6 h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/40 self-center mr-1">Status</span>
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
        >
          All
        </button>
        {REPORT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/40 self-center mr-1">Target</span>
        <button
          type="button"
          onClick={() => setTargetTypeFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!targetTypeFilter ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
        >
          All
        </button>
        {TARGET_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTargetTypeFilter(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${targetTypeFilter === t ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Reporter</th>
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Reported</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => (
              <Fragment key={report.id}>
                <tr className="border-b border-foreground/5 last:border-0">
                  <td className="px-5 py-3">
                    <button type="button" className="font-medium hover:underline" onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}>
                      {report.reporter.name}
                    </button>
                    <div className="text-xs text-foreground/40">{report.reporter.email}</div>
                  </td>
                  <td className="px-5 py-3 text-foreground/60">
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium">{report.targetType}</span>
                    <div className="mt-1 max-w-[160px] truncate text-xs text-foreground/40" title={report.targetId}>
                      {report.targetId}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-foreground/60">{report.reason.replace("_", " ")}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        report.status === "PENDING"
                          ? "bg-warning/15 text-warning"
                          : report.status === "REVIEWING"
                            ? "bg-blue-500/15 text-blue-400"
                            : report.status === "RESOLVED"
                              ? "bg-success/15 text-success"
                              : "bg-foreground/5 text-foreground/50"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-foreground/60">
                    {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                        className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                      >
                        {expandedId === report.id ? "Hide" : "Details"}
                      </button>
                      {report.status !== "DISMISSED" && (
                        <button
                          type="button"
                          onClick={() => updateReportStatus(report.id, "DISMISSED", "Dismissed by admin")}
                          className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === report.id && (
                  <tr className="border-b border-foreground/5 bg-foreground/[0.02] last:border-0">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1 text-sm">
                          <p><span className="text-foreground/40">Details: </span>{report.details ?? "—"}</p>
                          <p><span className="text-foreground/40">Reviewed by: </span>{report.reviewedBy?.name ?? "—"}</p>
                          <p><span className="text-foreground/40">Reviewed at: </span>{report.reviewedAt ? new Date(report.reviewedAt).toLocaleString() : "—"}</p>
                          <p><span className="text-foreground/40">Resolution note: </span>{report.resolutionNote ?? "—"}</p>
                        </div>
                        <div className="flex flex-wrap items-start gap-2">
                          {report.targetType === "USER" && (
                            <>
                              <button onClick={() => openUserAction(report, "WARN")} type="button" className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5">Warn</button>
                              <button onClick={() => openUserAction(report, "MUTE")} type="button" className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5">Mute</button>
                              <button onClick={() => openUserAction(report, "SUSPEND")} type="button" className="rounded-lg border border-warning/30 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10">Suspend</button>
                              <button onClick={() => openUserAction(report, "BAN")} type="button" className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">Ban</button>
                              <button onClick={() => openUserAction(report, "RESTORE")} type="button" className="rounded-lg border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10">Restore</button>
                            </>
                          )}
                          {report.targetType === "MESSAGE" && (
                            <button onClick={() => deleteReportedMessage(report)} type="button" className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">Delete Message</button>
                          )}
                          {report.targetType === "CONVERSATION" && (
                            <>
                              <button onClick={() => lockReportedConversation(report, true)} type="button" className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5">Lock</button>
                              <button onClick={() => lockReportedConversation(report, false)} type="button" className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5">Unlock</button>
                            </>
                          )}
                          {(report.targetType === "TRIP" || report.targetType === "GROUP") && (
                            <button
                              onClick={() => updateReportStatus(report.id, "REVIEWING", undefined)}
                              type="button"
                              className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                            >
                              Mark Reviewing
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {visibleReports.length === 0 && <div className="p-8 text-center text-sm text-foreground/50">No reports found</div>}
      </div>

      {userActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setUserActionModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{USER_ACTION_LABEL[userActionModal.action]} user</h3>
            <p className="mt-1 text-sm text-foreground/50">Target user id: {userActionModal.report.targetId}</p>
            {actionError && <p className="mt-2 text-sm text-red-400">{actionError}</p>}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/50">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  placeholder="Why is this action being taken?"
                />
              </div>
              {(userActionModal.action === "MUTE" || userActionModal.action === "SUSPEND") && (
                <div>
                  <label className="text-xs font-medium text-foreground/50">Duration (hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setUserActionModal(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button type="button" disabled={submitting} onClick={submitUserAction} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
                {submitting ? "Applying…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationsQueue() {
  const [conversations, setConversations] = useState<ModerationConversationSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState<ConversationActionModalState | null>(null);
  const [viewMessagesId, setViewMessagesId] = useState<string | null>(null);
  const [viewMessages, setViewMessages] = useState<any[] | null>(null);
  const [viewMessagesLoading, setViewMessagesLoading] = useState(false);
  const [viewMessagesError, setViewMessagesError] = useState<string | null>(null);
  const [viewReason, setViewReason] = useState("");
  const [viewReasonPending, setViewReasonPending] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Fetch chain lives directly in the effect (no synchronous setState before the
  // .then) so page changes re-fetch without a pre-emptive setLoading(true) call.
  useEffect(() => {
    fetch(`/api/admin/moderation/conversations?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [page]);

  function openAction(conversation: ModerationConversationSummaryDTO, action: ConversationActionModalState["action"]) {
    setActionModal({ conversation, action });
    setReason("");
  }

  function handleViewMessages(conversationId: string) {
    setViewReasonPending(conversationId);
    setViewReason("");
  }

  async function confirmViewMessages() {
    if (!viewReasonPending || !viewReason.trim()) return;
    setViewMessagesLoading(true);
    setViewMessagesError(null);
    setViewMessagesId(viewReasonPending);
    setViewReasonPending(null);
    try {
      const res = await fetch(`/api/admin/moderation/conversations/${viewMessagesId}/messages?reason=${encodeURIComponent(viewReason.trim())}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(data.error ?? "Failed to load messages");
      }
      const data = await res.json();
      setViewMessages(data.messages);
    } catch (err) {
      setViewMessagesError(err instanceof Error ? err.message : "Failed to load messages");
      setViewMessagesId(null);
    } finally {
      setViewMessagesLoading(false);
    }
  }

  async function submitAction() {
    if (!actionModal) return;
    const { conversation, action } = actionModal;
    setSubmitting(true);
    if (action === "DELETE") {
      const res = await fetch(`/api/admin/moderation/conversations/${conversation.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || "No reason given" }),
      });
      if (!res.ok) {
        toast.error("Unable to delete this conversation. Please try again.");
        setSubmitting(false);
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      toast.success("Conversation deleted successfully");
    } else {
      const locked = action === "LOCK";
      const res = await fetch(`/api/admin/moderation/conversations/${conversation.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked, reason: reason.trim() || "No reason given" }),
      });
      if (!res.ok) {
        toast.error("Unable to complete the request. Please try again.");
        setSubmitting(false);
        return;
      }
      setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, isLocked: locked } : c)));
      toast.success(locked ? "Conversation locked successfully" : "Conversation unlocked successfully");
    }
    setSubmitting(false);
    setActionModal(null);
  }

  if (loading) return <div className="mt-6 h-48 animate-pulse rounded-3xl bg-card" />;

  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Trip</th>
              <th className="px-5 py-3 font-medium">Participants</th>
              <th className="px-5 py-3 font-medium">Messages</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3 font-medium">{c.subject ?? "—"}</td>
                <td className="px-5 py-3 text-foreground/60">{c.tripTitle ?? "—"}</td>
                <td className="px-5 py-3 text-foreground/60">{c.participants.map((p) => p.name).join(", ")}</td>
                <td className="px-5 py-3 text-foreground/60">{c.messageCount}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.isLocked ? "bg-red-500/15 text-red-400" : "bg-success/15 text-success"}`}>
                    {c.isLocked ? "Locked" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    {c.isLocked ? (
                      <button type="button" onClick={() => openAction(c, "UNLOCK")} className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5">Unlock</button>
                    ) : (
                      <button type="button" onClick={() => openAction(c, "LOCK")} className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5">Lock</button>
                    )}
                    <button type="button" onClick={() => handleViewMessages(c.id)} className="rounded-lg border border-foreground/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground/5">View</button>
                    {viewReasonPending === c.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setViewReasonPending(null)}>
                        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                          <h3 className="text-lg font-semibold">Read conversation messages</h3>
                          <p className="mt-1 text-sm text-foreground/50">
                            Why are you reading this conversation? Every access is audit-logged.
                          </p>
                          <textarea
                            value={viewReason}
                            onChange={(e) => setViewReason(e.target.value)}
                            rows={3}
                            className="mt-4 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
                            placeholder="Investigation reason (required)"
                          />
                          <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setViewReasonPending(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium">Cancel</button>
                            <button type="button" disabled={!viewReason.trim()} onClick={confirmViewMessages} className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">Confirm</button>
                          </div>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={() => openAction(c, "DELETE")} className="rounded-lg border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {conversations.length === 0 && <div className="p-8 text-center text-sm text-foreground/50">No conversations found</div>}

        {/* Message viewer modal */}
        {viewMessagesId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setViewMessagesId(null); setViewMessages(null); }}>
            <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-card p-6 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conversation Messages</h3>
                <button type="button" onClick={() => { setViewMessagesId(null); setViewMessages(null); }} className="text-sm text-foreground/50 hover:text-foreground">Close</button>
              </div>
              {viewMessagesLoading && <div className="mt-4 animate-pulse h-32 bg-foreground/5 rounded-xl" />}
              {viewMessagesError && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{viewMessagesError}</div>}
              {viewMessages && (
                <div className="mt-4 space-y-3">
                  {viewMessages.length === 0 && <p className="text-sm text-foreground/50">No messages in this conversation.</p>}
                  {viewMessages.map((msg: any) => (
                    <div key={msg.id} className="rounded-xl border border-foreground/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground/60">{msg.senderName ?? "System"}</span>
                        <span className="text-[10px] text-foreground/40">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm">{msg.content ?? "[deleted]"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {total > 25 && (
        <div className="mt-4 flex items-center justify-between text-sm text-foreground/50">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-foreground/10 px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {page}</span>
          <button type="button" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-foreground/10 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">
              {actionModal.action === "DELETE" ? "Delete conversation?" : actionModal.action === "LOCK" ? "Lock conversation?" : "Unlock conversation?"}
            </h3>
            <div className="mt-4">
              <label className="text-xs font-medium text-foreground/50">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                placeholder="Reason for this action"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setActionModal(null)} className="flex-1 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5">Cancel</button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitAction}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  actionModal.action === "DELETE" ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-accent-hover"
                }`}
              >
                {submitting ? "Working…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
