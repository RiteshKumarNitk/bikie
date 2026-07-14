"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageDTO } from "@bikie/types";
import { ReportModal } from "@/components/shared/ReportModal";

export function MessageItem({ 
  msg, 
  isMe, 
  showAvatar,
  onDelete,
  onReact
}: { 
  msg: MessageDTO; 
  isMe: boolean; 
  showAvatar: boolean;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [reporting, setReporting] = useState(false);

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
          {!isMe && showAvatar && <p className="text-[10px] font-semibold text-accent mb-0.5">{msg.senderName}</p>}
          <p className="whitespace-pre-wrap">{msg.deletedAt ? "This message was deleted." : msg.content}</p>
          <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
            <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            {msg.editedAt && !msg.deletedAt && <span className="text-[9px]">(edited)</span>}
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
        {showActions && !msg.deletedAt && (
          <div className={`absolute top-0 -translate-y-full ${isMe ? "right-0" : "left-0"} mb-1 flex items-center gap-1 bg-card border border-foreground/10 rounded-full p-1 shadow-md z-20`}>
            {["👍", "❤️", "😂", "🔥"].map(emoji => (
              <button 
                key={emoji} 
                onClick={() => { onReact(msg.id, emoji); setShowActions(false); }}
                className="hover:scale-125 transition-transform px-1 text-sm"
              >
                {emoji}
              </button>
            ))}
            {isMe ? (
              <button
                onClick={() => { onDelete(msg.id); setShowActions(false); }}
                className="text-destructive hover:bg-destructive/10 rounded-full p-1 ml-1"
                title="Delete message"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            ) : (
              <button
                onClick={() => { setReporting(true); setShowActions(false); }}
                className="text-foreground/50 hover:bg-foreground/10 rounded-full p-1 ml-1"
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
