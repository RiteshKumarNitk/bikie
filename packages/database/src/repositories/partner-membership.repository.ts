import { prisma } from "../client";
import { isUniqueViolation } from "../lib/prisma-errors";

/** ADR-051 — a Service Provider's own membership, entirely separate from the Rider
 * `membership.repository.ts`/`UserMembership`. Mirrors that repository's shape deliberately. */

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

/** Includes the recurring-subscription fields (`razorpaySubscriptionId`/`subscriptionStatus`/
 * `currentPeriodStart`/`currentPeriodEnd`/`cancelledAt`/`lastPaymentId`) via `toMembershipDTO`
 * whenever the active row has them — a one-time/free/test-account row simply has `null` in all of
 * those columns, so this is a strict superset of the previous hand-rolled return shape, not a
 * behavior change for any non-subscription membership. Needed so `/partner/membership` (which
 * reads this route) can show the real next-payment/renewal date instead of guessing one. */
export async function getActiveMembership(userId: string) {
  const membership = await prisma.partnerMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (!membership) return null;

  return toMembershipDTO(membership);
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

// --- Recurring Razorpay Subscriptions (additive — `createMembership`/`findByPaymentReference`/
// `getActiveMembership` above are untouched and remain the one-time/free/test-account path). ---

/** Admin-informational only — the most recent `PartnerMembership` row for this user, regardless
 * of whether it's currently eligible (unlike `getActiveMembership`, which hides anything that
 * fails `status === ACTIVE && endDate >= now()`). Used by the admin partner-detail page so a
 * halted/pending/cancelled subscription, or a lapsed one-time membership, stays visible there
 * instead of silently disappearing once it's no longer eligibility-granting. Never used for any
 * eligibility decision. */
export async function findLatestMembershipForUser(userId: string) {
  const membership = await prisma.partnerMembership.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return membership ? toMembershipDTO(membership) : null;
}

/** Blocks starting a second subscription while one is already open for this user (created,
 * authenticated, active, pending, or halted — i.e. not cancelled/completed). */
export async function findOpenSubscriptionForUser(userId: string) {
  const membership = await prisma.partnerMembership.findFirst({
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
 * Creates the `PartnerMembership` row the moment a Razorpay Subscription is created — storing
 * `razorpaySubscriptionId` immediately (so the webhook has a row to find/update, per the task
 * spec) — but deliberately NOT eligible yet: `startDate === endDate` (now), which fails the
 * existing `endDate >= now()` SOS-eligibility/active-membership check the instant it's read,
 * exactly like a one-time membership that hasn't been paid for yet would. Eligibility only
 * begins once a webhook-confirmed charge calls `recordSubscriptionCharge` and pushes `endDate`
 * into the future — "do NOT activate PartnerMembership merely because subscription creation
 * succeeded".
 */
export async function createSubscriptionMembership(
  userId: string,
  planId: string,
  razorpaySubscriptionId: string,
  razorpayPlanId: string,
  subscriptionStatus: string,
) {
  const now = new Date();
  const membership = await prisma.partnerMembership.create({
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
  const membership = await prisma.partnerMembership.findUnique({
    where: { razorpaySubscriptionId },
    include: { plan: true },
  });
  return membership ? toMembershipDTO(membership) : null;
}

/** Admin-only "who's subscribed" view — every `PartnerMembership` row that's ever been
 * subscription-backed, most recent first, with the owning user's identity joined in. Deliberately
 * NOT sourced from invoices/transactions: a subscription that was created but never successfully
 * charged (no invoice exists for it yet — exactly what a missed webhook leaves behind) would be
 * invisible in any transaction-based view, but still needs to show up here so an admin can find
 * and reconcile/cancel it. */
export async function listAllSubscriptions() {
  const rows = await prisma.partnerMembership.findMany({
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

/**
 * The successful-recurring-payment path (`subscription.activated`/`subscription.charged`
 * webhook events, when a payment accompanies them): keeps `status` ACTIVE, extends `endDate` to
 * `currentPeriodEnd` — the single write that makes `findEligiblePartnersNearPoint`/
 * `getActiveMembership` see this provider as active again, with zero changes to either query.
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
  const membership = await prisma.partnerMembership.update({
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
 * `endDate`: "do not incorrectly mark an otherwise valid active period as expired unless the
 * actual membership period has ended" (the existing `endDate` check already enforces that on its
 * own, with no extra write needed here).
 */
export async function updateSubscriptionStatus(
  id: string,
  subscriptionStatus: string,
  opts: { cancelledAt?: Date } = {},
) {
  const membership = await prisma.partnerMembership.update({
    where: { id },
    data: {
      subscriptionStatus,
      ...(opts.cancelledAt ? { cancelledAt: opts.cancelledAt } : {}),
    },
    include: { plan: true },
  });
  return toMembershipDTO(membership);
}
