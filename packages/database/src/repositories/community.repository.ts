import { prisma } from "../client";

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
