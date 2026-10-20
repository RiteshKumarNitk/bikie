"use client";

import { useEffect, useState } from "react";

type Audience = "ALL" | "RIDER" | "SERVICE_PROVIDER" | "USER";

type AdminUser = { id: string; name: string; email: string; accountType: string | null };

type HistoryEntry = {
  id: string;
  createdAt: string;
  metadata: { audience?: string; title?: string; body?: string; recipientCount?: number } | null;
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  ALL: "All users",
  RIDER: "Riders",
  SERVICE_PROVIDER: "Service Providers",
  USER: "Individual user",
};

/** Admin → Notifications — sends a title/body announcement via the existing
 * `NotificationService.notifyMany` (in-app + fire-and-forget push, the same path every other
 * notification type already uses). Confirms before sending (irreversible once it reaches
 * devices), shows the recipient count on success, and lists recent sends below from the
 * existing AuditLog. */
export function NotificationComposer() {
  const [audience, setAudience] = useState<Audience>("ALL");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ recipientCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  async function loadHistory() {
    const res = await fetch("/api/admin/notifications");
    if (res.ok) {
      const data = await res.json();
      setHistory(data.history ?? []);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (audience !== "USER" || users.length > 0) return;
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => {});
  }, [audience, users.length]);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, userId: audience === "USER" ? userId : undefined, title, body }),
      });
      const data = await res.json().catch(() => ({}) as { error?: unknown });
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not send the notification.");
      }
      setResult({ recipientCount: data.recipientCount });
      setTitle("");
      setBody("");
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (audience !== "USER" || userId);

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        className="space-y-4 rounded-xl bg-white/5 p-4 backdrop-blur"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Audience</label>
          <select
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as Audience);
              setResult(null);
            }}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
          >
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>

        {audience === "USER" && (
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="">Select a user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email}) — {u.accountType ?? "no account type"}
              </option>
            ))}
          </select>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g., Important announcement from BIKIE)"
          maxLength={120}
          required
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          maxLength={500}
          required
          rows={4}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && (
          <p className="text-sm text-green-400">
            Sent to {result.recipientCount} recipient{result.recipientCount === 1 ? "" : "s"}.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSend || sending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90 disabled:opacity-50"
        >
          Send Notification
        </button>
      </form>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#111] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">Send this notification?</h3>
            <p className="mt-2 text-sm text-white/60">
              To: <span className="text-white">{AUDIENCE_LABEL[audience]}</span>
              {audience === "USER" && users.find((u) => u.id === userId) ? ` — ${users.find((u) => u.id === userId)?.name}` : ""}
            </p>
            <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
              <span className="font-semibold text-white">{title}</span>
              <br />
              <span className="text-white/70">{body}</span>
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex-1 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold/90 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-white/80">Recent notifications</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-white/40">No notifications sent yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {history.map((h) => (
              <div key={h.id} className="rounded-lg bg-white/5 p-3 text-sm">
                <p className="font-medium text-white">{h.metadata?.title ?? "(no title)"}</p>
                <p className="text-white/60">{h.metadata?.body}</p>
                <p className="mt-1 text-xs text-white/40">
                  {h.metadata?.audience ? AUDIENCE_LABEL[h.metadata.audience as Audience] : "—"} ·{" "}
                  {h.metadata?.recipientCount ?? 0} recipient{h.metadata?.recipientCount === 1 ? "" : "s"} ·{" "}
                  {new Date(h.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
