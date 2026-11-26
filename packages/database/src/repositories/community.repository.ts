import { prisma } from "../client";
import { createGroupAdmin, updateGroupAdmin, deleteGroupAdmin } from "./admin.repository";

const publicMemberCountInclude = { _count: { select: { members: { where: { status: "APPROVED" as const } } } } } as const;

export interface GroupSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  city: string | null;
  isPrivate: boolean;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  createdAt: Date;
}

function toSummary(g: {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  city: string | null;
  isPrivate: boolean;
  ownerId: string;
  owner: { name: string };
  createdAt: Date;
  _count: { members: number };
}): GroupSummary {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    description: g.description,
    imageUrl: g.imageUrl,
    type: g.type,
    city: g.city,
    isPrivate: g.isPrivate,
    ownerId: g.ownerId,
    ownerName: g.owner.name,
    memberCount: g._count.members,
    createdAt: g.createdAt,
  };
}

/** A Rider creates their own community — reuses `createGroupAdmin` as-is (it already creates the
 * OWNER's own approved GroupMember row atomically with the group; nothing Rider-specific needs to
 * change there, only who's allowed to call it, enforced in the application layer above this). */
export async function createOwnGroup(data: {
  name: string;
  description: string;
  imageUrl: string;
  type: "COMMUNITY" | "CLUB";
  city?: string;
  isPrivate?: boolean;
  ownerId: string;
}): Promise<GroupSummary> {
  const group = await prisma.group.findFirstOrThrow({
    where: { id: (await createGroupAdmin(data)).id },
    include: { owner: { select: { name: true } }, ...publicMemberCountInclude },
  });
  return toSummary(group);
}

/** Discovery — PUBLIC groups only, regardless of caller. Private groups never appear here no
 * matter who's asking; they're reachable only via `findGroupForViewer` for an existing member
 * (or the owner), never through search/browse. This is the one rule that keeps private-community
 * information from leaking to anyone not already in it. */
export async function findPublicGroups(filters: { search?: string; type?: "COMMUNITY" | "CLUB"; city?: string }): Promise<GroupSummary[]> {
  const groups = await prisma.group.findMany({
    where: {
      isPrivate: false,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true } }, ...publicMemberCountInclude },
  });
  return groups.map(toSummary);
}

export interface GroupMembershipRow {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  role: string;
  status: string;
  message: string | null;
  joinedAt: Date;
  decidedAt: Date | null;
}

/** Full detail for one viewer. Private-group detail (description, member list elsewhere, etc.) is
 * only returned when `viewerId` is the owner or has an existing (any-status) GroupMember row —
 * otherwise `null`, same as "not found" from the caller's perspective, so a non-member can't even
 * confirm what a private group's details are beyond its name/privacy flag already shown in their
 * own "a group exists" context (e.g. an invite link) — callers that only have an id for a group
 * they were never told about get nothing. */
export async function findGroupForViewer(groupId: string, viewerId: string): Promise<(GroupSummary & { viewerMembership: GroupMembershipRow | null }) | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { owner: { select: { name: true } }, ...publicMemberCountInclude },
  });
  if (!group) return null;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: viewerId } },
    include: { user: { select: { name: true } } },
  });

  if (group.isPrivate && group.ownerId !== viewerId && !membership) return null;

  return {
    ...toSummary(group),
    viewerMembership: membership
      ? {
          id: membership.id,
          groupId: membership.groupId,
          userId: membership.userId,
          userName: membership.user.name,
          role: membership.role,
          status: membership.status,
          message: membership.message,
          joinedAt: membership.joinedAt,
          decidedAt: membership.decidedAt,
        }
      : null,
  };
}

/** Every group this user owns or has ANY membership row for (any status — PENDING so they can see
 * their own outstanding join requests, REMOVED so "left communities" can be shown if ever wanted),
 * regardless of public/private. */
export async function findMyGroups(userId: string): Promise<Array<GroupSummary & { myRole: string; myStatus: string }>> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: { include: { owner: { select: { name: true } }, ...publicMemberCountInclude } } },
    orderBy: { joinedAt: "desc" },
  });
  return memberships.map((m) => ({ ...toSummary(m.group), myRole: m.role, myStatus: m.status }));
}

/** Member list for an existing OWNER/MODERATOR (sees every status, including PENDING requests to
 * decide on) vs. any other APPROVED member (sees only APPROVED members, never PENDING/REJECTED
 * requests from other Riders — those are the requester's and the owner/moderator's business only).
 * Returns `null` if the caller isn't an approved member/owner at all. */
export async function findMembersForViewer(groupId: string, viewerId: string): Promise<GroupMembershipRow[] | null> {
  const viewer = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: viewerId } } });
  if (!viewer || viewer.status !== "APPROVED") return null;

  const canSeeAllStatuses = viewer.role === "OWNER" || viewer.role === "MODERATOR";
  const rows = await prisma.groupMember.findMany({
    where: { groupId, ...(canSeeAllStatuses ? {} : { status: "APPROVED" }) },
    include: { user: { select: { name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    groupId: m.groupId,
    userId: m.userId,
    userName: m.user.name,
    role: m.role,
    status: m.status,
    message: m.message,
    joinedAt: m.joinedAt,
    decidedAt: m.decidedAt,
  }));
}

/** Join/rejoin — upserts the SAME row keyed on `@@unique([groupId, userId])`, exactly so leaving
 * (status → REMOVED, row kept) and later rejoining never produce a second row for the same
 * (group, user) pair. Public groups: status APPROVED immediately (no request step). Private
 * groups: status PENDING — the owner/moderator decides via `decideMembership`. Re-requesting
 * after a REJECTED or REMOVED row resets back to PENDING/APPROVED the same way. */
/** Lightweight existence + privacy check — the one thing `joinGroup` needs before deciding
 * PENDING vs APPROVED, without pulling the whole public-groups list or the full detail/redaction
 * logic `findGroupForViewer` does. */
export async function findGroupPrivacy(groupId: string): Promise<{ isPrivate: boolean; ownerId: string; name: string } | null> {
  return prisma.group.findUnique({ where: { id: groupId }, select: { isPrivate: true, ownerId: true, name: true } });
}

export async function upsertMembership(
  groupId: string,
  userId: string,
  input: { status: "PENDING" | "APPROVED"; message?: string | null },
): Promise<GroupMembershipRow | null> {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) return null;

  const row = await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId, role: "MEMBER", status: input.status, message: input.message ?? null },
    update: { status: input.status, message: input.message ?? null, decidedAt: input.status === "APPROVED" ? new Date() : null },
    include: { user: { select: { name: true } } },
  });
  return {
    id: row.id,
    groupId: row.groupId,
    userId: row.userId,
    userName: row.user.name,
    role: row.role,
    status: row.status,
    message: row.message,
    joinedAt: row.joinedAt,
    decidedAt: row.decidedAt,
  };
}

export type MembershipDecisionResult =
  | { ok: true; groupId: string; userId: string; groupName: string }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_DECIDED" };

/** Atomic CAS: the `updateMany` only matches a row that's still `PENDING`, so two concurrent
 * decisions (e.g. two moderators approving/rejecting the same request at once) can't both
 * "succeed" — only the first write's `WHERE` still matches; the second gets `count: 0` and is
 * told `ALREADY_DECIDED` rather than silently overwriting the first decision. */
export async function decideMembership(
  groupId: string,
  targetUserId: string,
  deciderId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<MembershipDecisionResult> {
  const [decider, group] = await Promise.all([
    prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: deciderId } } }),
    prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
  ]);
  if (!group) return { ok: false, reason: "NOT_FOUND" };
  if (!decider || decider.status !== "APPROVED" || (decider.role !== "OWNER" && decider.role !== "MODERATOR")) {
    return { ok: false, reason: "FORBIDDEN" };
  }

  const result = await prisma.groupMember.updateMany({
    where: { groupId, userId: targetUserId, status: "PENDING" },
    data: { status: decision, decidedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, reason: "ALREADY_DECIDED" };
  return { ok: true, groupId, userId: targetUserId, groupName: group.name };
}

/** A member leaves of their own accord — always allowed for an APPROVED member, CAS-guarded the
 * same way (only an APPROVED row transitions, so leaving twice concurrently is a harmless no-op
 * on the second call rather than a duplicate notification/side effect). */
export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const result = await prisma.groupMember.updateMany({
    where: { groupId, userId, status: "APPROVED" },
    data: { status: "REMOVED", decidedAt: new Date() },
  });
  return result.count > 0;
}

export type RemoveMemberResult =
  | { ok: true; groupId: string; userId: string; groupName: string }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_REMOVED" | "CANNOT_REMOVE_OWNER" };

/** Owner/moderator removes someone else — same CAS pattern, plus an explicit guard against
 * removing the OWNER (ownership changes are a separate, deliberate action this task doesn't
 * build, not a side effect of a moderator's "remove member" tap). */
export async function removeMember(groupId: string, targetUserId: string, removedById: string): Promise<RemoveMemberResult> {
  const [remover, target, group] = await Promise.all([
    prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: removedById } } }),
    prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } }),
    prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
  ]);
  if (!group || !target) return { ok: false, reason: "NOT_FOUND" };
  if (!remover || remover.status !== "APPROVED" || (remover.role !== "OWNER" && remover.role !== "MODERATOR")) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (target.role === "OWNER") return { ok: false, reason: "CANNOT_REMOVE_OWNER" };

  const result = await prisma.groupMember.updateMany({
    where: { groupId, userId: targetUserId, status: { not: "REMOVED" } },
    data: { status: "REMOVED", decidedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, reason: "ALREADY_REMOVED" };
  return { ok: true, groupId, userId: targetUserId, groupName: group.name };
}

/** Edit — owner-only (mirrors `removeMember`'s "ownership changes stay deliberate" reasoning;
 * a MODERATOR can manage members but not rename/reconfigure the community itself). Reuses
 * `updateGroupAdmin`'s actual write, same as `createOwnGroup` reuses `createGroupAdmin`. */
export type UpdateGroupResult = { ok: true; group: GroupSummary } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" };

export async function updateOwnGroup(
  groupId: string,
  requesterId: string,
  data: Partial<{ name: string; description: string; imageUrl: string; city: string | null; isPrivate: boolean }>,
): Promise<UpdateGroupResult> {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
  if (!group) return { ok: false, reason: "NOT_FOUND" };
  if (group.ownerId !== requesterId) return { ok: false, reason: "FORBIDDEN" };

  const updated = await updateGroupAdmin(groupId, data);
  const full = await prisma.group.findUniqueOrThrow({
    where: { id: updated.id },
    include: { owner: { select: { name: true } }, ...publicMemberCountInclude },
  });
  return { ok: true, group: toSummary(full) };
}

/** Delete — owner-only. Reuses `deleteGroupAdmin`'s actual delete (GroupMember rows cascade via
 * the existing `onDelete: Cascade` on that relation; the group's Conversation, if any, is kept
 * via `onDelete: SetNull`, unchanged existing behavior). */
export async function deleteOwnGroup(groupId: string, requesterId: string): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }> {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
  if (!group) return { ok: false, reason: "NOT_FOUND" };
  if (group.ownerId !== requesterId) return { ok: false, reason: "FORBIDDEN" };

  await deleteGroupAdmin(groupId);
  return { ok: true };
}

/**
 * Community/club prioritization (ADR-033 Phase D hook, port fully implemented in Phase A so
 * the later pass needs no schema/repo change): which of the given candidate users share an
 * approved Group (Community or Club) membership with the reporter.
 */
export async function findSharedGroupMemberIds(
  reporterId: string,
  candidateUserIds: string[],
): Promise<Set<string>> {
  if (candidateUserIds.length === 0) return new Set();

  const reporterGroups = await prisma.groupMember.findMany({
    where: { userId: reporterId, status: "APPROVED" },
    select: { groupId: true },
  });
  const groupIds = reporterGroups.map((g) => g.groupId);
  if (groupIds.length === 0) return new Set();

  const shared = await prisma.groupMember.findMany({
    where: { groupId: { in: groupIds }, userId: { in: candidateUserIds }, status: "APPROVED" },
    select: { userId: true },
  });
  return new Set(shared.map((m) => m.userId));
}
