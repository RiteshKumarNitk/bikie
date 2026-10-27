import { prisma } from "../client";
import { isUniqueViolation } from "../lib/prisma-errors";

/** Mirrors `partner-membership.repository.ts`'s shape deliberately — a Rider's own membership,
 * entirely separate from the Service Provider `PartnerMembership`/`PartnerMembershipPlan`. */

/** Razorpay Subscription statuses that mean "still open" — a second subscription must never be
 * started while one of these is in flight for the same user (duplicate-subscription guard). */
const OPEN_SUBSCRIPTION_STATUSES = ["created", "authenticated", "active", "pending", "halted"];

function toMembershipDTO(membership: {
  id: string;
  userId: string;
  planId: string;
  plan: { id: string; name: string; description: string; price: unknown; durationDays: number; benefits: string[]; isActive: boolean };
  startDate: Date;
  endDate: Date;
  status: string;
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  subscriptionStatus: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  lastPaymentId: string | null;
}) {
  const daysLeft = Math.ceil((membership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    id: membership.id,
    userId: membership.userId,
    planId: membership.planId,
    plan: {
      id: membership.plan.id,
      name: membership.plan.name,
      description: membership.plan.description,
      price: (membership.plan.price as { toNumber(): number }).toNumber(),
      durationDays: membership.plan.durationDays,
      benefits: membership.plan.benefits,
      isActive: membership.plan.isActive,
    },
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
    status: membership.status,
    daysLeft: Math.max(0, daysLeft),
    razorpaySubscriptionId: membership.razorpaySubscriptionId,
    razorpayPlanId: membership.razorpayPlanId,
    subscriptionStatus: membership.subscriptionStatus,
    currentPeriodStart: membership.currentPeriodStart ? membership.currentPeriodStart.toISOString() : null,
    currentPeriodEnd: membership.currentPeriodEnd ? membership.currentPeriodEnd.toISOString() : null,
    cancelledAt: membership.cancelledAt ? membership.cancelledAt.toISOString() : null,
    lastPaymentId: membership.lastPaymentId,
  };
}

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

/** Includes the recurring-subscription fields (`razorpaySubscriptionId`/`subscriptionStatus`/
 * `currentPeriodStart`/`currentPeriodEnd`/`cancelledAt`/`lastPaymentId`) via `toMembershipDTO`
 * whenever the active row has them — a one-time/free/legacy row simply has `null` in all of
 * those columns, so this is a strict superset of the previous return shape, not a behavior
 * change for any non-subscription membership. Mirrors `partner-membership.repository.ts`'s
 * identical change for the Service Provider side. */
export async function getActiveMembership(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (!membership) return null;

  return toMembershipDTO(membership);
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

// --- Recurring Razorpay Subscriptions (additive — `createMembership`/`findByPaymentReference`/
// `getActiveMembership` above are untouched and remain the one-time/free/legacy path). Mirrors
// `partner-membership.repository.ts`'s identical section exactly, for Rider ₹149/year instead of
// Service Provider ₹99/month. ---

/** Admin-informational only — the most recent `UserMembership` row for this user, regardless of
 * whether it's currently eligible (unlike `getActiveMembership`, which hides anything that fails
 * `status === ACTIVE && endDate >= now()`). Never used for any eligibility decision. */
export async function findLatestMembershipForUser(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return membership ? toMembershipDTO(membership) : null;
}

/** Blocks starting a second subscription while one is already open for this user (created,
 * authenticated, active, pending, or halted — i.e. not cancelled/completed). */
export async function findOpenSubscriptionForUser(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      razorpaySubscriptionId: { not: null },
      subscriptionStatus: { in: OPEN_SUBSCRIPTION_STATUSES },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return membership ? toMembershipDTO(membership) : null;
}

/**
 * Creates the `UserMembership` row the moment a Razorpay Subscription is created — storing
 * `razorpaySubscriptionId` immediately (so the webhook has a row to find/update) — but
 * deliberately NOT eligible yet: `startDate === endDate` (now), which fails the existing
 * `endDate >= now()` eligibility check the instant it's read, exactly like a one-time membership
 * that hasn't been paid for yet would. Eligibility only begins once a webhook-confirmed charge
 * calls `recordSubscriptionCharge` and pushes `endDate` into the future.
 */
export async function createSubscriptionMembership(
  userId: string,
  planId: string,
  razorpaySubscriptionId: string,
  razorpayPlanId: string,
  subscriptionStatus: string,
) {
  const now = new Date();
  const membership = await prisma.userMembership.create({
    data: {
      userId,
      planId,
      startDate: now,
      endDate: now,
      razorpaySubscriptionId,
      razorpayPlanId,
      subscriptionStatus,
    },
    include: { plan: true },
  });
  return toMembershipDTO(membership);
}

export async function findByRazorpaySubscriptionId(razorpaySubscriptionId: string) {
  const membership = await prisma.userMembership.findUnique({
    where: { razorpaySubscriptionId },
    include: { plan: true },
  });
  return membership ? toMembershipDTO(membership) : null;
}

/**
 * The successful-recurring-payment path (`subscription.activated`/`subscription.charged`
 * webhook events, when a payment accompanies them): keeps `status` ACTIVE, extends `endDate` to
 * `currentPeriodEnd` — the single write that makes `getActiveMembership` see this Rider as
 * active again, with zero changes to that query.
 */
export async function recordSubscriptionCharge(
  id: string,
  data: {
    subscriptionStatus: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date;
    lastPaymentId: string;
  },
) {
  const membership = await prisma.userMembership.update({
    where: { id },
    data: {
      status: "ACTIVE",
      endDate: data.currentPeriodEnd,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      lastPaymentId: data.lastPaymentId,
      subscriptionStatus: data.subscriptionStatus,
    },
    include: { plan: true },
  });
  return toMembershipDTO(membership);
}

/**
 * Status-only update for `subscription.pending`/`subscription.halted`/`subscription.completed`,
 * and the non-charge branch of `subscription.cancelled` — deliberately never touches `status` or
 * `endDate`: do not incorrectly mark an otherwise valid active period as expired unless the
 * actual membership period has ended (the existing `endDate` check already enforces that on its
 * own, with no extra write needed here).
 */
export async function updateSubscriptionStatus(
  id: string,
  subscriptionStatus: string,
  opts: { cancelledAt?: Date } = {},
) {
  const membership = await prisma.userMembership.update({
    where: { id },
    data: {
      subscriptionStatus,
      ...(opts.cancelledAt ? { cancelledAt: opts.cancelledAt } : {}),
    },
    include: { plan: true },
  });
  return toMembershipDTO(membership);
}

/** Admin-only "who's subscribed" view — every `UserMembership` row that's ever been
 * subscription-backed, most recent first, with the owning user's identity joined in. Mirrors
 * `partner-membership.repository.ts`'s `listAllSubscriptions` exactly. */
export async function listAllSubscriptions() {
  const rows = await prisma.userMembership.findMany({
    where: { razorpaySubscriptionId: { not: null } },
    include: { plan: true, user: { select: { name: true, email: true, phoneNumber: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    ...toMembershipDTO(row),
    userName: row.user.name,
    userEmail: row.user.email,
    userPhone: row.user.phoneNumber,
  }));
}
