import { prisma } from "../client";

function randomCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: randomCode(user.name) },
      });
      return updated.referralCode!;
    } catch {
      // unique collision — retry with a new random suffix
    }
  }
  throw new Error("Could not generate a unique referral code");
}

export async function getMyReferrals(userId: string) {
  const referrals = await prisma.user.findMany({
    where: { referredById: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return referrals.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function linkReferral(userId: string, code: string): Promise<boolean> {
  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer || referrer.id === userId) return false;

  const result = await prisma.user.updateMany({
    where: { id: userId, referredById: null },
    data: { referredById: referrer.id },
  });
  return result.count > 0;
}
