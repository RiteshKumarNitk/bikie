"use client";

import { ChatArea } from "@/components/chat/ChatArea";

/**
 * Thin wrapper around the existing Community Platform chat component — an SOS session's chat
 * is a plain two-participant Conversation (created in sos-session.repository.ts's acceptOffer
 * transaction), not a new chat system (ADR-033).
 */
export function SOSSessionChat({
  conversationId,
  userId,
  helper,
  rider,
}: {
  conversationId: string;
  userId: string;
  helper: { id: string; name: string };
  rider: { id: string; name: string };
}) {
  return (
    <div className="h-[28rem]">
      <ChatArea
        conversationId={conversationId}
        subject="SOS Chat"
        participants={[helper, rider]}
        userId={userId}
      />
    </div>
  );
}
