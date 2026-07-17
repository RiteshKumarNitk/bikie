import { prisma } from "../client";

/** Upsert by the unique `token` — re-points `userId` in case the same device/browser is
 * later used by a different account (rare, but a real edge case worth handling explicitly
 * rather than erroring on the unique constraint). */
export async function upsertToken(userId: string, token: string) {
  await prisma.pushSubscription.upsert({
    where: { token },
    create: { userId, token },
    update: { userId },
  });
}

export async function deleteToken(token: string) {
  await prisma.pushSubscription.deleteMany({ where: { token } });
}

export async function findByUserId(userId: string) {
  return prisma.pushSubscription.findMany({ where: { userId }, select: { token: true } });
}
