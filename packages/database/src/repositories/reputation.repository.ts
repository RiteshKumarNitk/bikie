import { prisma } from "../client";

/** Called once a session completes — the "did they actually help" counter. */
export async function recordAssist(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { emergencyResponseCount: { increment: 1 } },
  });
}

/**
 * Weighted-average update, not a hot path (ratings are low-frequency) so a plain
 * transactional read-then-write is fine — no need for the raw-SQL atomic-increment style
 * `acceptOffer` uses for the actually-contended assignment race.
 */
export async function recordRating(userId: string, rating: number) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { helperRatingAvg: true, helperRatingCount: true },
    });
    const oldCount = user.helperRatingCount;
    const oldAvg = user.helperRatingAvg.toNumber();
    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + rating) / newCount;

    await tx.user.update({
      where: { id: userId },
      data: {
        helperRatingCount: newCount,
        helperRatingAvg: Math.round(newAvg * 10) / 10,
      },
    });
  });
}

export async function getStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emergencyResponseCount: true, helperRatingAvg: true, helperRatingCount: true },
  });
  if (!user) return null;
  return {
    emergencyResponseCount: user.emergencyResponseCount,
    helperRatingAvg: user.helperRatingAvg.toNumber(),
    helperRatingCount: user.helperRatingCount,
  };
}
