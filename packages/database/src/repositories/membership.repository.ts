import { prisma } from "../client";
import { isUniqueViolation } from "../lib/prisma-errors";

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

/** Server-side price lookup for Razorpay order creation (ADR-043) — never trust a
 * client-supplied amount for what to charge. */
export async function findPlanById(planId: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price.toNumber(),
    durationDays: plan.durationDays,
    benefits: plan.benefits,
    isActive: plan.isActive,
  };
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

/** ADR-069 — idempotency lookup: has this exact payment reference already activated a
 * membership? Used by the service layer to make a replayed `/purchase` callback safe. Matches
 * either identifier; the DB `@unique` on both columns is the real guarantee, this is the
 * check-first fast path (and the recovery read after a P2002 race). */
export async function findByPaymentReference(ref: { paymentId?: string | null; razorpayOrderId?: string | null }) {
  const or: Array<{ razorpayOrderId: string } | { paymentId: string }> = [];
  if (ref.razorpayOrderId) or.push({ razorpayOrderId: ref.razorpayOrderId });
  if (ref.paymentId) or.push({ paymentId: ref.paymentId });
  if (or.length === 0) return null;

  const membership = await prisma.userMembership.findFirst({
    where: { OR: or },
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
  razorpayOrderId?: string,
) {
  const plan = await prisma.membershipPlan.findUniqueOrThrow({ where: { id: planId } });
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  let membership;
  try {
    membership = await prisma.userMembership.create({
      data: { userId, planId, startDate, endDate, paymentId, razorpayOrderId },
      include: { plan: true },
    });
  } catch (err) {
    // ADR-069 — a concurrent duplicate `/purchase` for the same payment lost the race on the
    // `paymentId`/`razorpayOrderId` unique index; return the membership the winner created
    // rather than surfacing a 500.
    if (isUniqueViolation(err)) {
      const existing = await findByPaymentReference({ paymentId, razorpayOrderId });
      if (existing) return existing;
    }
    throw err;
  }

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