import { prisma } from "../client";

export async function findAllActivePlans() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toNumber(),
    durationDays: p.durationDays,
    benefits: p.benefits,
    isActive: p.isActive,
  }));
}

export async function getActiveMembership(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (!membership) return null;

  const daysLeft = Math.ceil((membership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    id: membership.id,
    userId: membership.userId,
    planId: membership.planId,
    plan: {
      id: membership.plan.id,
      name: membership.plan.name,
      description: membership.plan.description,
      price: membership.plan.price.toNumber(),
      durationDays: membership.plan.durationDays,
      benefits: membership.plan.benefits,
      isActive: membership.plan.isActive,
    },
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
    status: membership.status,
    daysLeft: Math.max(0, daysLeft),
  };
}

export async function createMembership(
  userId: string,
  planId: string,
  paymentId?: string,
) {
  const plan = await prisma.membershipPlan.findUniqueOrThrow({ where: { id: planId } });
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const membership = await prisma.userMembership.create({
    data: { userId, planId, startDate, endDate, paymentId },
    include: { plan: true },
  });

  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    id: membership.id,
    userId: membership.userId,
    planId: membership.planId,
    plan: {
      id: membership.plan.id,
      name: membership.plan.name,
      description: membership.plan.description,
      price: membership.plan.price.toNumber(),
      durationDays: membership.plan.durationDays,
      benefits: membership.plan.benefits,
      isActive: membership.plan.isActive,
    },
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
    status: membership.status,
    daysLeft,
  };
}