import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  communityRepository: {},
}));

import { createCommunityModule } from "./public";
import type { CommunityPorts, GroupSummary, GroupMembershipRow } from "./ports";

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    id: "group-1",
    slug: "riders-club",
    name: "Riders Club",
    description: "A club",
    imageUrl: "",
    type: "COMMUNITY",
    city: null,
    isPrivate: false,
    ownerId: "owner-1",
    ownerName: "Owner One",
    memberCount: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

function membership(overrides: Partial<GroupMembershipRow> = {}): GroupMembershipRow {
  return {
    id: "member-1",
    groupId: "group-1",
    userId: "user-1",
    userName: "User One",
    role: "MEMBER",
    status: "APPROVED",
    message: null,
    joinedAt: new Date(),
    decidedAt: null,
    ...overrides,
  };
}

function emptyPorts(overrides: Partial<CommunityPorts> = {}): CommunityPorts {
  return {
    groups: {
      findGroupPrivacy: vi.fn(async () => null),
      createOwnGroup: vi.fn(async (data) => group(data)),
      findPublicGroups: vi.fn(async () => []),
      findGroupForViewer: vi.fn(async () => null),
      findMyGroups: vi.fn(async () => []),
      findMembersForViewer: vi.fn(async () => null),
      upsertMembership: vi.fn(async (groupId, userId, input) => membership({ groupId, userId, status: input.status })),
      decideMembership: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
      leaveGroup: vi.fn(async () => true),
      removeMember: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
      updateOwnGroup: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
      deleteOwnGroup: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
    },
    notifications: { notify: vi.fn(async () => {}) },
    ...overrides,
  };
}

describe("community.application — group creation and discovery", () => {
  it("createGroup passes the caller as ownerId, never a client-supplied one", async () => {
    const ports = emptyPorts();
    const { community } = createCommunityModule(ports);

    await community.createGroup("user-1", {
      name: "Riders Club",
      description: "A club",
      imageUrl: "",
      type: "COMMUNITY",
    });

    expect(ports.groups.createOwnGroup).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: "user-1" }),
    );
  });

  it("discoverGroups only ever calls findPublicGroups — never a method that could surface a private group", async () => {
    const ports = emptyPorts();
    const { community } = createCommunityModule(ports);

    await community.discoverGroups({ search: "riders" });

    expect(ports.groups.findPublicGroups).toHaveBeenCalledWith({ search: "riders" });
    expect(ports.groups.findGroupForViewer).not.toHaveBeenCalled();
  });
});

describe("community.application — join / rejoin", () => {
  it("joining a public group upserts APPROVED status and never notifies the owner", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        findGroupPrivacy: vi.fn(async () => ({ isPrivate: false, ownerId: "owner-1", name: "Riders Club" })),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.joinGroup("group-1", "user-1");

    expect(result.ok).toBe(true);
    expect(ports.groups.upsertMembership).toHaveBeenCalledWith(
      "group-1",
      "user-1",
      expect.objectContaining({ status: "APPROVED" }),
    );
    expect(ports.notifications.notify).not.toHaveBeenCalled();
  });

  it("joining a private group upserts PENDING status and notifies the owner", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        findGroupPrivacy: vi.fn(async () => ({ isPrivate: true, ownerId: "owner-1", name: "Private Club" })),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.joinGroup("group-1", "user-1");

    expect(result.ok).toBe(true);
    expect(ports.groups.upsertMembership).toHaveBeenCalledWith(
      "group-1",
      "user-1",
      expect.objectContaining({ status: "PENDING" }),
    );
    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "owner-1",
      "GROUP_JOIN_REQUESTED",
      expect.any(String),
      expect.any(String),
      "Group",
      "group-1",
    );
  });

  it("joining a nonexistent group returns NOT_FOUND without ever reaching upsertMembership", async () => {
    const ports = emptyPorts();
    const { community } = createCommunityModule(ports);

    const result = await community.joinGroup("ghost-group", "user-1");

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(ports.groups.upsertMembership).not.toHaveBeenCalled();
  });

  it("leaveGroup delegates straight to the repository's leaveGroup (the upsert-safe rejoin counterpart)", async () => {
    const ports = emptyPorts();
    const { community } = createCommunityModule(ports);

    const result = await community.leaveGroup("group-1", "user-1");

    expect(result).toEqual({ ok: true });
    expect(ports.groups.leaveGroup).toHaveBeenCalledWith("group-1", "user-1");
  });
});

describe("community.application — membership decisions (atomic CAS + idempotent notify)", () => {
  it("a retried/raced decision that's ALREADY_DECIDED never notifies again", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        decideMembership: vi.fn(async () => ({ ok: false, reason: "ALREADY_DECIDED" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.decideJoinRequest("group-1", "user-1", "owner-1", "APPROVED");

    expect(result).toEqual({ ok: false, reason: "ALREADY_DECIDED" });
    expect(ports.notifications.notify).not.toHaveBeenCalled();
  });

  it("an APPROVED decision notifies the target user with GROUP_JOIN_APPROVED", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        decideMembership: vi.fn(async () => ({ ok: true, groupId: "group-1", userId: "user-1", groupName: "Riders Club" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    await community.decideJoinRequest("group-1", "user-1", "owner-1", "APPROVED");

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "user-1",
      "GROUP_JOIN_APPROVED",
      expect.any(String),
      expect.any(String),
      "Group",
      "group-1",
    );
  });

  it("a REJECTED decision notifies the target user with GROUP_JOIN_REJECTED", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        decideMembership: vi.fn(async () => ({ ok: true, groupId: "group-1", userId: "user-1", groupName: "Riders Club" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    await community.decideJoinRequest("group-1", "user-1", "owner-1", "REJECTED");

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "user-1",
      "GROUP_JOIN_REJECTED",
      expect.any(String),
      expect.any(String),
      "Group",
      "group-1",
    );
  });

  it("FORBIDDEN from the repository (non-OWNER/MODERATOR decider) passes through untouched, no notify", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        decideMembership: vi.fn(async () => ({ ok: false, reason: "FORBIDDEN" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.decideJoinRequest("group-1", "user-1", "random-member", "APPROVED");

    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(ports.notifications.notify).not.toHaveBeenCalled();
  });
});

describe("community.application — removeMember", () => {
  it("CANNOT_REMOVE_OWNER passes through untouched, no notify", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        removeMember: vi.fn(async () => ({ ok: false, reason: "CANNOT_REMOVE_OWNER" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.removeMember("group-1", "owner-1", "moderator-1");

    expect(result).toEqual({ ok: false, reason: "CANNOT_REMOVE_OWNER" });
    expect(ports.notifications.notify).not.toHaveBeenCalled();
  });

  it("a successful removal notifies the removed member with GROUP_MEMBER_REMOVED", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        removeMember: vi.fn(async () => ({ ok: true, groupId: "group-1", userId: "user-1", groupName: "Riders Club" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    await community.removeMember("group-1", "user-1", "owner-1");

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "user-1",
      "GROUP_MEMBER_REMOVED",
      expect.any(String),
      expect.any(String),
      "Group",
      "group-1",
    );
  });
});

describe("community.application — updateGroup / deleteGroup owner-only authorization", () => {
  it("updateGroup FORBIDDEN passes through from the repository untouched", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        updateOwnGroup: vi.fn(async () => ({ ok: false, reason: "FORBIDDEN" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.updateGroup("group-1", "not-the-owner", { name: "New name" });

    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("deleteGroup FORBIDDEN passes through from the repository untouched", async () => {
    const ports = emptyPorts({
      groups: {
        ...emptyPorts().groups,
        deleteOwnGroup: vi.fn(async () => ({ ok: false, reason: "FORBIDDEN" }) as const),
      },
    });
    const { community } = createCommunityModule(ports);

    const result = await community.deleteGroup("group-1", "not-the-owner");

    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});
