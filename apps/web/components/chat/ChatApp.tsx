"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { Conversation } from "./types";

export function ChatApp() {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setLoading(false);
        const fromQuery = searchParams.get("conversation");
        if (fromQuery) setSelectedConv(fromQuery);
      });
  }, [searchParams]);

  if (loading || !session) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center rounded-3xl bg-card border border-foreground/10">
        <div className="animate-pulse space-y-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-foreground/10"></div>
          <div className="h-4 w-32 bg-foreground/10 rounded"></div>
        </div>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === selectedConv);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full rounded-3xl overflow-hidden border border-foreground/10 bg-background shadow-xl">
      <ChatSidebar 
        conversations={conversations} 
        selectedConv={selectedConv} 
        setSelectedConv={setSelectedConv}
        userId={session.user.id}
      />
      {selectedConv && activeConv ? (
        <ChatArea 
          conversationId={selectedConv} 
          subject={activeConv.subject}
          participants={activeConv.participants}
          userId={session.user.id}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-card">
          <div className="text-center opacity-50">
            <p className="text-lg font-semibold">Your Messages</p>
            <p className="text-sm mt-1">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
