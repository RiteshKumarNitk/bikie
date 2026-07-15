"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageDTO } from "@bikie/types";
import { MessageItem } from "./MessageItem";

const TYPING_STOP_DELAY_MS = 3000;

export function ChatArea({
  conversationId,
  subject,
  participants,
  userId,
}: {
  conversationId: string;
  subject: string | null;
  participants: any[];
  userId: string;
}) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMarkedReadIdRef = useRef<string | null>(null);

  const messagesById = useMemo(() => {
    const map = new Map<string, MessageDTO>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  function postTyping(isTyping: boolean) {
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping }),
    }).catch(() => {});
  }

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
    setReplyTo(null);
    setNewMessage("");
    lastMarkedReadIdRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark the latest message as read whenever the open thread advances.
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id === lastMarkedReadIdRef.current) return;
    lastMarkedReadIdRef.current = last.id;
    fetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upToMessageId: last.id }),
    }).catch(() => {});
  }, [messages, conversationId]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    clearTyping();
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage, replyToId: replyTo?.id }),
    });
    const data = await res.json();
    if (!res.ok || !data.message) {
      alert(data.error === "MUTED" ? "You've been muted and can't send messages right now." : "Couldn't send that message.");
      return;
    }
    setMessages((prev) => [...prev, data.message]);
    setNewMessage("");
    setReplyTo(null);
  }

  function clearTyping() {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      postTyping(false);
    }
  }

  function handleComposerChange(value: string) {
    setNewMessage(value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        postTyping(true);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        postTyping(false);
      }, TYPING_STOP_DELAY_MS);
    } else {
      clearTyping();
    }
  }

  // Stop typing when leaving the conversation/unmounting.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) postTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Handle SSE manually for now until we have a real-time provider
  useEffect(() => {
    setTypingUserIds([]);
    const sse = new EventSource("/api/sse");

    sse.addEventListener("new_message", (e) => {
      const msg = JSON.parse((e as MessageEvent).data);
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    sse.addEventListener("message_edited", (e) => {
      const msg = JSON.parse((e as MessageEvent).data);
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    sse.addEventListener("message_deleted", (e) => {
      const msg = JSON.parse((e as MessageEvent).data);
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    sse.addEventListener("reaction_added", (e) => {
      const { messageId, userId: reactorId, emoji } = JSON.parse((e as MessageEvent).data);
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        if (m.reactions?.some(r => r.userId === reactorId && r.emoji === emoji)) return m;
        return { ...m, reactions: [...(m.reactions || []), { emoji, userId: reactorId, createdAt: new Date().toISOString() }] };
      }));
    });

    sse.addEventListener("reaction_removed", (e) => {
      const { messageId, userId: reactorId, emoji } = JSON.parse((e as MessageEvent).data);
      setMessages((prev) => prev.map((m) => (
        m.id === messageId
          ? { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === reactorId && r.emoji === emoji)) }
          : m
      )));
    });

    sse.addEventListener("message_read", (e) => {
      const { conversationId: cid, userId: readerId, upToMessageId } = JSON.parse((e as MessageEvent).data);
      if (cid !== conversationId) return;
      setMessages((prev) => {
        const target = prev.find((m) => m.id === upToMessageId);
        if (!target) return prev;
        const cutoff = new Date(target.createdAt).getTime();
        const now = new Date().toISOString();
        return prev.map((m) => {
          if (new Date(m.createdAt).getTime() > cutoff) return m;
          const receipts = m.receipts || [];
          const idx = receipts.findIndex((r) => r.userId === readerId);
          if (idx === -1) return m;
          if (receipts[idx].readAt) return m;
          const nextReceipts = [...receipts];
          nextReceipts[idx] = { ...nextReceipts[idx], readAt: nextReceipts[idx].readAt ?? now, deliveredAt: nextReceipts[idx].deliveredAt ?? now };
          return { ...m, receipts: nextReceipts };
        });
      });
    });

    sse.addEventListener("typing", (e) => {
      const { conversationId: cid, userId: typistId, isTyping } = JSON.parse((e as MessageEvent).data);
      if (cid !== conversationId || typistId === userId) return;
      setTypingUserIds((prev) => {
        if (isTyping) return prev.includes(typistId) ? prev : [...prev, typistId];
        return prev.filter((id) => id !== typistId);
      });
    });

    return () => sse.close();
  }, [conversationId, userId]);

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this message for everyone?")) return;
    const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m));
    }
  }

  async function handleEdit(messageId: string, content: string): Promise<boolean> {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error === "FORBIDDEN" ? "You can only edit your own messages." : "Couldn't edit this message.");
      return false;
    }
    setMessages((prev) => prev.map((m) => (m.id === messageId ? data.message : m)));
    return true;
  }

  async function handleReact(messageId: string, emoji: string) {
    const msg = messages.find(m => m.id === messageId);
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.userId === userId);

    if (existing) {
      await fetch(`/api/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}`, { method: "DELETE" });
      setMessages(prev => prev.map(m => m.id === messageId ? {
        ...m, reactions: m.reactions?.filter(r => r.userId !== userId || r.emoji !== emoji)
      } : m));
    } else {
      await fetch(`/api/messages/${messageId}/react`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji })
      });
      setMessages(prev => prev.map(m => m.id === messageId ? {
        ...m, reactions: [...(m.reactions || []), { emoji, userId, createdAt: new Date().toISOString() }]
      } : m));
    }
  }

  const typingNames = typingUserIds
    .map((id) => participants.find((p) => p.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-foreground/10 bg-card overflow-hidden">
      <div className="border-b border-foreground/10 px-6 py-4 bg-foreground/5 flex flex-col justify-center">
        <p className="font-semibold text-lg">{subject || "Group Chat"}</p>
        <p className="text-xs text-foreground/50">
          {participants.length} members
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-card/50">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === userId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId || messages[idx - 1].type === "SYSTEM");
          const replyToMessage = msg.replyToId ? messagesById.get(msg.replyToId) : undefined;

          return (
            <MessageItem
              key={msg.id}
              msg={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              replyToMessage={replyToMessage}
              onDelete={handleDelete}
              onReact={handleReact}
              onEdit={handleEdit}
              onReply={setReplyTo}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingNames.length > 0 && (
        <div className="px-6 pb-1 pt-2 text-xs text-foreground/50 italic bg-card">
          {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
        </div>
      )}

      <div className="border-t border-foreground/10 p-4 bg-card">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-accent-text">Replying to {replyTo.senderName ?? "message"}</p>
              <p className="truncate text-xs text-foreground/60">{replyTo.deletedAt ? "This message was deleted." : replyTo.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 text-foreground/40 hover:text-foreground"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleComposerChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-foreground/15 bg-transparent px-5 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
