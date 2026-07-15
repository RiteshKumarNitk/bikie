"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MessageDTO } from "@bikie/types";
import { ReportModal } from "@/components/shared/ReportModal";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function ReadReceiptTicks({ msg }: { msg: MessageDTO }) {
  const others = msg.receipts ?? [];
  if (others.length === 0) {
    // No recipients tracked yet (e.g. just sent) — single grey tick = "sent".
    return (
      <svg width="14" height="10" viewBox="0 0 16 11" fill="none" className="text-white/70">
        <path d="M1 5.5 5 9.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const allRead = others.every((r) => r.readAt);
  const allDelivered = others.every((r) => r.deliveredAt);
  if (allRead) {
    return (
      <svg width="18" height="10" viewBox="0 0 20 11" fill="none" className="text-accent-text">
        <path d="M1 5.5 5 9.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 5.5 12 9.5 19 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (allDelivered) {
    return (
      <svg width="18" height="10" viewBox="0 0 20 11" fill="none" className="text-white/70">
        <path d="M1 5.5 5 9.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 5.5 12 9.5 19 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="10" viewBox="0 0 16 11" fill="none" className="text-white/70">
      <path d="M1 5.5 5 9.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageItem({
  msg,
  isMe,
  showAvatar,
  replyToMessage,
  onDelete,
  onReact,
  onEdit,
  onReply,
}: {
  msg: MessageDTO;
  isMe: boolean;
  showAvatar: boolean;
  replyToMessage?: MessageDTO;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onEdit: (id: string, content: string) => Promise<boolean>;
  onReply: (msg: MessageDTO) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (msg.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs font-medium bg-foreground/5 px-3 py-1.5 rounded-full text-foreground/60 border border-foreground/10">
          {msg.content}
        </span>
      </div>
    );
  }

  // Count reactions by emoji
  const reactionsMap: Record<string, number> = {};
  msg.reactions?.forEach(r => {
    reactionsMap[r.emoji] = (reactionsMap[r.emoji] || 0) + 1;
  });

  function startEdit() {
    setEditValue(msg.content ?? "");
    setEditing(true);
    setShowActions(false);
  }

  async function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === msg.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onEdit(msg.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
  }

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMe && (
        <div className="relative w-8 h-8 rounded-full bg-foreground/10 shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-foreground/50">
          {showAvatar ? (msg.senderImage ? <Image src={msg.senderImage} alt={msg.senderName || "Sender"} fill className="object-cover" /> : msg.senderName?.[0] || "?") : ""}
        </div>
      )}

      <div className="flex flex-col relative max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm relative ${
            isMe
              ? "bg-accent text-white rounded-br-none"
              : "bg-foreground/5 text-foreground rounded-bl-none border border-foreground/10"
          } ${msg.deletedAt ? "opacity-50 italic" : ""}`}
        >
          {!isMe && showAvatar && <p className="text-[10px] font-semibold text-accent-text mb-0.5">{msg.senderName}</p>}

          {msg.replyToId && !msg.deletedAt && (
            <div
              className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs ${
                isMe ? "border-white/40 bg-white/10 text-white/80" : "border-accent-text/50 bg-foreground/5 text-foreground/70"
              }`}
            >
              <p className="font-semibold">{replyToMessage?.senderName ?? "Original message"}</p>
              <p className="truncate">
                {replyToMessage ? (replyToMessage.deletedAt ? "This message was deleted." : replyToMessage.content) : "…"}
              </p>
            </div>
          )}

          {editing ? (
            <div className="min-w-[180px]">
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
                }}
                disabled={saving}
                className="w-full rounded-lg bg-black/20 px-2 py-1 text-sm text-white outline-none disabled:opacity-60"
              />
              <div className="mt-1 flex justify-end gap-2 text-[10px] opacity-80">
                <button type="button" onClick={() => setEditing(false)}>Cancel</button>
                <button type="button" onClick={saveEdit} disabled={saving} className="font-semibold">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.deletedAt ? "This message was deleted." : msg.content}</p>
          )}

          <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
            <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            {msg.editedAt && !msg.deletedAt && <span className="text-[9px]">(edited)</span>}
            {isMe && !msg.deletedAt && <ReadReceiptTicks msg={msg} />}
          </div>
        </div>

        {/* Reactions Display */}
        {Object.keys(reactionsMap).length > 0 && !msg.deletedAt && (
          <div className={`flex gap-1 mt-1 relative z-10 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionsMap).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="bg-card border border-foreground/10 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm hover:bg-foreground/5"
              >
                <span>{emoji}</span>
                <span className="text-[10px] opacity-70">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Actions */}
        {showActions && !msg.deletedAt && !editing && (
          <div className={`absolute top-0 -translate-y-full ${isMe ? "right-0" : "left-0"} mb-1 flex items-center gap-1 bg-card border border-foreground/10 rounded-full p-1 shadow-md z-20`}>
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onReact(msg.id, emoji); setShowActions(false); }}
                className="hover:scale-125 transition-transform px-1 text-sm"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => { onReply(msg); setShowActions(false); }}
              className="text-foreground/50 hover:bg-foreground/10 rounded-full p-1 ml-1"
              title="Reply"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            </button>
            {isMe && (
              <button
                onClick={startEdit}
                className="text-foreground/50 hover:bg-foreground/10 rounded-full p-1"
                title="Edit message"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
            )}
            {isMe ? (
              <button
                onClick={() => { onDelete(msg.id); setShowActions(false); }}
                className="text-red-400 hover:bg-red-400/10 rounded-full p-1"
                title="Delete message"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            ) : (
              <button
                onClick={() => { setReporting(true); setShowActions(false); }}
                className="text-foreground/50 hover:bg-foreground/10 rounded-full p-1"
                title="Report message"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {reporting && (
        <ReportModal targetType="MESSAGE" targetId={msg.id} title="Report message" onClose={() => setReporting(false)} />
      )}
    </div>
  );
}
