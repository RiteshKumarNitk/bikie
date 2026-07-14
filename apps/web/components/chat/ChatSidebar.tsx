"use client";

import { useState } from "react";
import Image from "next/image";
import { Conversation } from "./types";
import { NotificationsTab } from "./NotificationsTab";

export function ChatSidebar({ 
  conversations, 
  selectedConv, 
  setSelectedConv,
  userId
}: { 
  conversations: Conversation[]; 
  selectedConv: string | null; 
  setSelectedConv: (id: string) => void;
  userId: string;
}) {
  const [tab, setTab] = useState<"chats" | "notifications">("chats");

  return (
    <div className="w-full shrink-0 flex flex-col h-full lg:w-80 border-r border-foreground/10 bg-card/30">
      <div className="flex p-4 border-b border-foreground/10 gap-2">
        <button
          onClick={() => setTab("chats")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "chats" ? "bg-foreground/10 text-foreground" : "text-foreground/50 hover:bg-foreground/5"
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "notifications" ? "bg-foreground/10 text-foreground" : "text-foreground/50 hover:bg-foreground/5"
          }`}
        >
          Updates
        </button>
      </div>

      {tab === "chats" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No active chats</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== userId);
              const label = conv.subject ?? (conv.participants.length > 2 ? `${conv.participants.length} riders` : other?.name ?? "Unknown");
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    selectedConv === conv.id
                      ? "bg-accent/10 border border-accent/20"
                      : "hover:bg-foreground/5 border border-transparent"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full bg-foreground/10 shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-foreground/50">
                    {other?.image ? <Image src={other.image} alt={label} fill className="object-cover" /> : label[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{label}</p>
                    <p className="text-xs text-foreground/50 truncate mt-0.5">
                      {conv.lastMessage?.content ?? "New chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <NotificationsTab userId={userId} />
      )}
    </div>
  );
}
