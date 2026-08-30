import { prisma } from "../client";
import { isUniqueViolation } from "../lib/prisma-errors";

/** ADR-051 — a Service Provider's own membership, entirely separate from the Rider
 * `membership.repository.ts`/`UserMembership`. Mirrors that repository's shape deliberately. */

export async function findAllActivePlans() {
  const plans = await prisma.partnerMembershipPlan.findMany({
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

/** Server-side price lookup for Razorpay order creation — never trust a client-supplied amount
 * for what to charge, and the price is also what decides the free-tier shortcut. */
export async function findPlanById(planId: string) {
  const plan = await prisma.partnerMembershipPlan.findUnique({ where: { id: planId } });
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
  const membership = await prisma.partnerMembership.findFirst({
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

/** ADR-069 — idempotency lookup, mirrors `membership.repository.ts`'s `findByPaymentReference`. */
export async function findByPaymentReference(ref: { paymentId?: string | null; razorpayOrderId?: string | null }) {
  const or: Array<{ razorpayOrderId: string } | { paymentId: string }> = [];
  if (ref.razorpayOrderId) or.push({ razorpayOrderId: ref.razorpayOrderId });
  if (ref.paymentId) or.push({ paymentId: ref.paymentId });
  if (or.length === 0) return null;

  const membership = await prisma.partnerMembership.findFirst({
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
  const plan = await prisma.partnerMembershipPlan.findUniqueOrThrow({ where: { id: planId } });
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  let membership;
  try {
    membership = await prisma.partnerMembership.create({
      data: { userId, planId, startDate, endDate, paymentId, razorpayOrderId },
      include: { plan: true },
    });
  } catch (err) {
    // ADR-069 — concurrent duplicate lost the unique-index race; return the winner's row.
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
