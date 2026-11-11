import type { CommunityPorts, GroupSummary, GroupMembershipRow } from "../ports";

export function createCommunityApplication(ports: CommunityPorts) {
  return {
    /** Creator becomes OWNER with an APPROVED membership atomically — see
     * `createOwnGroup`'s repository doc comment (it reuses `createGroupAdmin`, which already
     * does this in one write). */
    async createGroup(
      ownerId: string,
      input: { name: string; description: string; imageUrl: string; type: "COMMUNITY" | "CLUB"; city?: string; isPrivate?: boolean },
    ): Promise<GroupSummary> {
      return ports.groups.createOwnGroup({ ...input, ownerId });
    },

    async discoverGroups(filters: { search?: string; type?: "COMMUNITY" | "CLUB"; city?: string }): Promise<GroupSummary[]> {
      // Public groups only, unconditionally — see findPublicGroups's own doc comment for why
      // this is the one rule that keeps private-community info from leaking to a non-member.
      return ports.groups.findPublicGroups(filters);
    },

    async getGroupDetail(groupId: string, viewerId: string) {
      return ports.groups.findGroupForViewer(groupId, viewerId);
    },

    async getMyGroups(userId: string): Promise<Array<GroupSummary & { myRole: string; myStatus: string }>> {
      return ports.groups.findMyGroups(userId);
    },

    async getMembers(groupId: string, viewerId: string): Promise<GroupMembershipRow[] | null> {
      return ports.groups.findMembersForViewer(groupId, viewerId);
    },

    /** Public group: joins (or rejoins) as APPROVED immediately. Private group: PENDING, the
     * owner/moderator must decide. Either way this is the single upsert keyed on
     * `(groupId, userId)` that makes leave→rejoin safe without a duplicate-row risk — see
     * `upsertMembership`'s own doc comment. */
    async joinGroup(
      groupId: string,
      userId: string,
      message?: string,
    ): Promise<{ ok: true; membership: GroupMembershipRow } | { ok: false; reason: "NOT_FOUND" }> {
      const group = await ports.groups.findGroupPrivacy(groupId);
      if (!group) return { ok: false, reason: "NOT_FOUND" };

      const membership = await ports.groups.upsertMembership(groupId, userId, {
        status: group.isPrivate ? "PENDING" : "APPROVED",
        message: message ?? null,
      });
      // upsertMembership re-checks existence itself too (defensive, in case of a race with the
      // group being deleted between the two calls) — null here means that race happened.
      if (!membership) return { ok: false, reason: "NOT_FOUND" };

      if (group.isPrivate) {
        await ports.notifications.notify(
          group.ownerId,
          "GROUP_JOIN_REQUESTED",
          "New join request",
          `Someone requested to join "${group.name}".`,
          "Group",
          groupId,
        );
      }

      return { ok: true, membership };
    },

    async leaveGroup(groupId: string, userId: string): Promise<{ ok: true } | { ok: false; reason: "NOT_A_MEMBER" }> {
      const left = await ports.groups.leaveGroup(groupId, userId);
      if (!left) return { ok: false, reason: "NOT_A_MEMBER" };
      return { ok: true };
    },

    /** Atomic CAS inside `decideMembership` — see its own doc comment. Only notifies on a
     * decision that genuinely just happened (ok: true), never on ALREADY_DECIDED. */
    async decideJoinRequest(
      groupId: string,
      targetUserId: string,
      deciderId: string,
      decision: "APPROVED" | "REJECTED",
    ) {
      const result = await ports.groups.decideMembership(groupId, targetUserId, deciderId, decision);
      if (!result.ok) return result;

      await ports.notifications.notify(
        targetUserId,
        decision === "APPROVED" ? "GROUP_JOIN_APPROVED" : "GROUP_JOIN_REJECTED",
        decision === "APPROVED" ? "Join request approved" : "Join request declined",
        decision === "APPROVED"
          ? `You're in! Your request to join "${result.groupName}" was approved.`
          : `Your request to join "${result.groupName}" was declined.`,
        "Group",
        groupId,
      );
      return result;
    },

    async removeMember(groupId: string, targetUserId: string, removedById: string) {
      const result = await ports.groups.removeMember(groupId, targetUserId, removedById);
      if (!result.ok) return result;

      // Never notify when the removal is the member's own self-removal path (that's leaveGroup,
      // a different method) — removeMember is always an owner/moderator acting on someone else.
      await ports.notifications.notify(
        targetUserId,
        "GROUP_MEMBER_REMOVED",
        "Removed from community",
        `You were removed from "${result.groupName}".`,
        "Group",
        groupId,
      );
      return result;
    },

    async updateGroup(
      groupId: string,
      requesterId: string,
      data: Partial<{ name: string; description: string; imageUrl: string; city: string | null; isPrivate: boolean }>,
    ) {
      return ports.groups.updateOwnGroup(groupId, requesterId, data);
    },

    async deleteGroup(groupId: string, requesterId: string) {
      return ports.groups.deleteOwnGroup(groupId, requesterId);
    },
  };
}
