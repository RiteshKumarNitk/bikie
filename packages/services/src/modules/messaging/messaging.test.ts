import { describe, expect, it, vi } from "vitest";
import { isAccountMuted } from "./domain/mute";
import { createMessagesApplication } from "./application/messages.application";
import type { MessagingPorts } from "./ports";

describe("mute policy", () => {
  const now = new Date("2026-08-02T00:00:00Z");

  it("treats MUTED without expiry as muted", () => {
    expect(isAccountMuted({ accountStatus: "MUTED", accountStatusExpiresAt: null, now })).toBe(true);
  });

  it("respects mute expiry", () => {
    expect(
      isAccountMuted({
        accountStatus: "MUTED",
        accountStatusExpiresAt: new Date("2026-07-01T00:00:00Z"),
        now,
      }),
    ).toBe(false);
    expect(
      isAccountMuted({
        accountStatus: "MUTED",
        accountStatusExpiresAt: new Date("2026-09-01T00:00:00Z"),
        now,
      }),
    ).toBe(true);
  });

  it("ignores non-muted statuses", () => {
    expect(isAccountMuted({ accountStatus: "ACTIVE", now })).toBe(false);
    expect(isAccountMuted({ accountStatus: "BANNED", now })).toBe(false);
  });
});

function fakePorts(overrides: Partial<MessagingPorts["store"]> = {}): MessagingPorts {
  return {
    store: {
      getConversationsForUser: vi.fn(),
      getMessagesRaw: vi.fn(async () => []),
      isParticipant: vi.fn(async () => true),
      isConversationLocked: vi.fn(async () => false),
      markDelivered: vi.fn(),
      sendMessage: vi.fn(async () => ({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        sender: null,
        type: "TEXT",
        content: "hi",
        ciphertext: null,
        iv: null,
        authTag: null,
        encryptionVersion: null,
        metadata: null,
        replyToId: null,
        editedAt: null,
        deletedAt: null,
        attachments: [],
        receipts: [],
        reactions: [],
        createdAt: new Date(),
      })) as never,
      getOtherParticipantIds: vi.fn(async () => []),
      getParticipantIds: vi.fn(async () => []),
      findMessageById: vi.fn(),
      editMessage: vi.fn(),
      deleteMessage: vi.fn(),
      markRead: vi.fn(),
      findConversationByParticipants: vi.fn(),
      createConversation: vi.fn(),
      addReaction: vi.fn(),
      removeReaction: vi.fn(),
      ...overrides,
    } as MessagingPorts["store"],
    crypto: { encrypt: vi.fn((plaintext: string) => ({ ciphertext: plaintext, iv: "iv", authTag: "tag", encryptionVersion: 1 })), decrypt: vi.fn() },
    realtime: { publishToUsers: vi.fn(async () => undefined), publishTyping: vi.fn(async () => undefined) },
    accountStatus: { getAccountStatus: vi.fn(async () => null) },
    notifications: { notifyMany: vi.fn(async () => undefined) },
  };
}

describe("sendMessage authorization (security fix — conversation membership + lock)", () => {
  it("rejects a non-participant with NOT_FOUND, without ever writing a message", async () => {
    const isParticipant = vi.fn(async () => false);
    const sendMessage = vi.fn();
    const ports = fakePorts({ isParticipant, sendMessage: sendMessage as never });
    const app = createMessagesApplication(ports);

    const result = await app.sendMessage("conv-1", "intruder", { content: "hello" });

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("rejects a real participant with LOCKED when the conversation is locked, without writing a message", async () => {
    const isConversationLocked = vi.fn(async () => true);
    const sendMessage = vi.fn();
    const ports = fakePorts({ isConversationLocked, sendMessage: sendMessage as never });
    const app = createMessagesApplication(ports);

    const result = await app.sendMessage("conv-1", "member-1", { content: "hello" });

    expect(result).toEqual({ ok: false, reason: "LOCKED" });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("allows a real participant in an unlocked conversation to send", async () => {
    const ports = fakePorts();
    const app = createMessagesApplication(ports);

    const result = await app.sendMessage("conv-1", "member-1", { content: "hello" });

    expect(result.ok).toBe(true);
  });
});
