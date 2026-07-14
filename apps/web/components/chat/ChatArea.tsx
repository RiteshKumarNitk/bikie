"use client";

import { useEffect, useRef, useState } from "react";
import { MessageDTO } from "@bikie/types";
import { MessageItem } from "./MessageItem";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
    setNewMessage("");
  }

  // Handle SSE manually for now until we have a real-time provider
  useEffect(() => {
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
    return () => sse.close();
  }, [conversationId]);

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this message for everyone?")) return;
    const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m));
    }
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

          return (
            <MessageItem 
              key={msg.id}
              msg={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-foreground/10 p-4 bg-card">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
