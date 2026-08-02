import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  reportRepository: {},
  moderationRepository: {},
  messageRepository: {},
  auditRepository: {},
}));

import {
  createTrustSafetyModule,
  isReportStatus,
  moderationExpiresAt,
} from "./public";
import type { TrustSafetyPorts } from "./ports";

describe("moderation domain", () => {
  it("computes absolute expiry from duration hours", () => {
    const now = new Date("2026-08-02T00:00:00Z");
    expect(moderationExpiresAt(24, now).toISOString()).toBe("2026-08-03T00:00:00.000Z");
  });

  it("validates report statuses", () => {
    expect(isReportStatus("PENDING")).toBe(true);
    expect(isReportStatus("bogus")).toBe(false);
  });
});

describe("moderation application", () => {
  it("writes MUTED status with ledger + notify + realtime", async () => {
    const setAccountStatus = vi.fn(async () => undefined);
    const createAction = vi.fn(async () => undefined);
    const notify = vi.fn(async () => undefined);
    const publishToUser = vi.fn(async () => undefined);

    const ports: TrustSafetyPorts = {
      reports: {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdWithRelations: vi.fn(),
        findMany: vi.fn(async () => []),
        updateStatus: vi.fn(),
      },
      moderation: {
        listConversationsForModeration: vi.fn(async () => ({ conversations: [], total: 0 })),
        createAction,
        lockConversation: vi.fn(),
        deleteConversation: vi.fn(),
        setAccountStatus,
      },
      messages: {
        findMessageById: vi.fn(),
        deleteMessage: vi.fn(),
        getOtherParticipantIds: vi.fn(async () => []),
      },
      notifications: { notify },
      realtime: {
        publishToAdmins: vi.fn(),
        publishToUsers: vi.fn(),
        publishToUser,
      },
      audit: { log: vi.fn() },
    };

    const module = createTrustSafetyModule(ports);
    await module.moderation.muteUser("u1", "admin", "spam", 2, "r1");

    expect(setAccountStatus).toHaveBeenCalledWith("u1", "MUTED", expect.any(Date));
    expect(createAction).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: "u1",
        adminId: "admin",
        type: "MUTE",
        reason: "spam",
        reportId: "r1",
      }),
    );
    expect(notify).toHaveBeenCalled();
    expect(publishToUser).toHaveBeenCalledWith(
      "u1",
      "moderation_action",
      expect.objectContaining({ type: "MUTE" }),
    );
  });

  it("returns NOT_FOUND when deleting a missing message", async () => {
    const module = createTrustSafetyModule({
      reports: {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdWithRelations: vi.fn(),
        findMany: vi.fn(async () => []),
        updateStatus: vi.fn(),
      },
      moderation: {
        listConversationsForModeration: vi.fn(async () => ({ conversations: [], total: 0 })),
        createAction: vi.fn(),
        lockConversation: vi.fn(),
        deleteConversation: vi.fn(),
        setAccountStatus: vi.fn(),
      },
      messages: {
        findMessageById: vi.fn(async () => null),
        deleteMessage: vi.fn(),
        getOtherParticipantIds: vi.fn(async () => []),
      },
      notifications: { notify: vi.fn() },
      realtime: {
        publishToAdmins: vi.fn(),
        publishToUsers: vi.fn(),
        publishToUser: vi.fn(),
      },
      audit: { log: vi.fn() },
    });

    await expect(module.moderation.deleteMessage("m1", "admin", "spam")).resolves.toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });
});
