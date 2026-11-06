import { communityRepository } from "@bikie/database";
import { NotificationService } from "../../../notification.service";
import type { CommunityRepositoryPort, CommunityNotificationPort } from "../ports";

export function createCommunityRepositoryAdapter(): CommunityRepositoryPort {
  return {
    findGroupPrivacy: (groupId) => communityRepository.findGroupPrivacy(groupId),
    createOwnGroup: (data) => communityRepository.createOwnGroup(data),
    findPublicGroups: (filters) => communityRepository.findPublicGroups(filters),
    findGroupForViewer: (groupId, viewerId) => communityRepository.findGroupForViewer(groupId, viewerId),
    findMyGroups: (userId) => communityRepository.findMyGroups(userId),
    findMembersForViewer: (groupId, viewerId) => communityRepository.findMembersForViewer(groupId, viewerId),
    upsertMembership: (groupId, userId, input) => communityRepository.upsertMembership(groupId, userId, input),
    decideMembership: (groupId, targetUserId, deciderId, decision) =>
      communityRepository.decideMembership(groupId, targetUserId, deciderId, decision),
    leaveGroup: (groupId, userId) => communityRepository.leaveGroup(groupId, userId),
    removeMember: (groupId, targetUserId, removedById) => communityRepository.removeMember(groupId, targetUserId, removedById),
    updateOwnGroup: (groupId, requesterId, data) => communityRepository.updateOwnGroup(groupId, requesterId, data),
    deleteOwnGroup: (groupId, requesterId) => communityRepository.deleteOwnGroup(groupId, requesterId),
  };
}

export function createCommunityNotificationAdapter(): CommunityNotificationPort {
  return {
    notify: (userId, type, title, body, entity, entityId) =>
      NotificationService.notify(userId, type as never, title, body, entity, entityId),
  };
}
