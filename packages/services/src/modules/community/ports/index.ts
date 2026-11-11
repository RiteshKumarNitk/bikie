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

export type MembershipDecisionResult =
  | { ok: true; groupId: string; userId: string; groupName: string }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_DECIDED" };

export type RemoveMemberResult =
  | { ok: true; groupId: string; userId: string; groupName: string }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_REMOVED" | "CANNOT_REMOVE_OWNER" };

export interface CommunityRepositoryPort {
  findGroupPrivacy(groupId: string): Promise<{ isPrivate: boolean; ownerId: string; name: string } | null>;
  createOwnGroup(data: {
    name: string;
    description: string;
    imageUrl: string;
    type: "COMMUNITY" | "CLUB";
    city?: string;
    isPrivate?: boolean;
    ownerId: string;
  }): Promise<GroupSummary>;
  findPublicGroups(filters: { search?: string; type?: "COMMUNITY" | "CLUB"; city?: string }): Promise<GroupSummary[]>;
  findGroupForViewer(groupId: string, viewerId: string): Promise<(GroupSummary & { viewerMembership: GroupMembershipRow | null }) | null>;
  findMyGroups(userId: string): Promise<Array<GroupSummary & { myRole: string; myStatus: string }>>;
  findMembersForViewer(groupId: string, viewerId: string): Promise<GroupMembershipRow[] | null>;
  upsertMembership(groupId: string, userId: string, input: { status: "PENDING" | "APPROVED"; message?: string | null }): Promise<GroupMembershipRow | null>;
  decideMembership(groupId: string, targetUserId: string, deciderId: string, decision: "APPROVED" | "REJECTED"): Promise<MembershipDecisionResult>;
  leaveGroup(groupId: string, userId: string): Promise<boolean>;
  removeMember(groupId: string, targetUserId: string, removedById: string): Promise<RemoveMemberResult>;
  updateOwnGroup(
    groupId: string,
    requesterId: string,
    data: Partial<{ name: string; description: string; imageUrl: string; city: string | null; isPrivate: boolean }>,
  ): Promise<{ ok: true; group: GroupSummary } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }>;
  deleteOwnGroup(groupId: string, requesterId: string): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }>;
}

export interface CommunityNotificationPort {
  notify(userId: string, type: string, title: string, body: string, entity?: string, entityId?: string): Promise<void>;
}

export interface CommunityPorts {
  groups: CommunityRepositoryPort;
  notifications: CommunityNotificationPort;
}
