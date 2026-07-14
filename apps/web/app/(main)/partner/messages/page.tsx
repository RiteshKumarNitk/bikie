"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@bikie/ui";
import { EmptyState } from "@/components/shared/EmptyState";

interface Conversation {
  id: string;
  subject: string | null;
  participants: { id: string; name: string; role: string }[];
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export default function PartnerMessagesPage() {
  const { data: session } = authClient.useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => { setConversations(data.conversations); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    fetch(`/api/conversations/${selectedConv}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages));
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!selectedConv || !newMessage.trim()) return;
    const res = await fetch(`/api/conversations/${selectedConv}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
    setNewMessage("");
  }

  const activeConv = conversations.find((c) => c.id === selectedConv);
  const otherParticipant = activeConv?.participants.find((p) => p.id !== session?.user.id);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="mt-1 text-sm text-foreground/50">Chat with your customers</p>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="w-full shrink-0 space-y-2 lg:w-72">
          {conversations.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="When customers message you, conversations will appear here."
            />
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== session?.user.id);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedConv === conv.id
                      ? "border-accent bg-accent/10"
                      : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  <p className="text-sm font-medium">{other?.name ?? "Unknown"}</p>
                  <p className="mt-0.5 truncate text-xs text-foreground/50">
                    {conv.lastMessage?.content ?? "No messages"}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="flex min-h-[400px] flex-1 flex-col rounded-2xl border border-foreground/10 bg-card">
          {selectedConv && activeConv ? (
            <>
              <div className="border-b border-foreground/10 px-5 py-4">
                <p className="font-medium">{otherParticipant?.name ?? "Chat"}</p>
                <p className="text-xs text-foreground/50">
                  {activeConv.participants
                    .filter((p) => p.id !== session?.user.id)
                    .map((p) => p.role)
                    .join(", ")}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.map((msg) => {
                  const isMe = msg.senderId === session?.user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-accent text-white"
                            : "bg-foreground/5 text-foreground"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`mt-1 text-[10px] ${isMe ? "text-white/60" : "text-foreground/40"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-foreground/10 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-foreground/50">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}