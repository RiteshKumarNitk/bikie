import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client.js";

/** Thrown when the alert already has an assigned helper — the accept transaction lost the race. */
export class AlreadyAssignedError extends Error {}

/** Thrown when the offer being accepted/rejected/withdrawn is no longer in the OFFERED state. */
export class OfferNotAvailableError extends Error {}

/** Thrown on the `[alertId, responderId]` unique constraint — this helper already has an
 * offer (any status) on this alert; a second `createOffer` would otherwise 500. */
export class AlreadyOfferedError extends Error {}

export async function createOffer(params: {
  alertId: string;
  responderId: string;
  distanceMeters?: number;
  etaMinutes?: number;
  message?: string;
}) {
  try {
    return await prisma.sOSAlertResponse.create({
      data: {
        alertId: params.alertId,
        responderId: params.responderId,
        distanceMeters: params.distanceMeters,
        etaMinutes: params.etaMinutes,
        message: params.message,
        status: "OFFERED",
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AlreadyOfferedError("You've already offered to help with this alert");
    }
    throw err;
  }
}

export async function withdrawOffer(offerId: string, responderId: string) {
  const result = await prisma.sOSAlertResponse.updateMany({
    where: { id: offerId, responderId, status: "OFFERED" },
    data: { status: "WITHDRAWN", respondedAt: new Date(), respondedBy: responderId },
  });
  if (result.count === 0) throw new OfferNotAvailableError("Offer is no longer available");
}

export async function rejectOffer(alertId: string, offerId: string, actorId: string) {
  const result = await prisma.sOSAlertResponse.updateMany({
    where: { id: offerId, alertId, status: "OFFERED" },
    data: { status: "REJECTED", respondedAt: new Date(), respondedBy: actorId },
  });
  if (result.count === 0) throw new OfferNotAvailableError("Offer is no longer available");
}

export async function listOffersForAlert(alertId: string) {
  return prisma.sOSAlertResponse.findMany({
    where: { alertId },
    orderBy: { createdAt: "asc" },
    include: { responder: { select: { id: true, name: true, phone: true, email: true } } },
  });
}

/**
 * The transactional accept — the single mechanism preventing two helpers from both being
 * assigned to the same alert. The guard is `WHERE assignedHelperId IS NULL` embedded inside
 * the mutating `updateMany`, not a separate read-then-write: under Postgres's default Read
 * Committed isolation, concurrent transactions serialize on the row lock, and the loser's
 * conditional update genuinely affects 0 rows once the winner commits — no silent overwrite,
 * no need to raise to Serializable isolation. If anything below throws, Prisma rolls back the
 * whole transaction, including the alert claim, so no partial assignment can persist.
 */
export async function acceptOffer(params: { alertId: string; offerId: string; actorId: string }) {
  const { alertId, offerId, actorId } = params;

  return prisma.$transaction(async (tx) => {
    const offer = await tx.sOSAlertResponse.findUnique({ where: { id: offerId } });
    if (!offer || offer.alertId !== alertId || offer.status !== "OFFERED") {
      throw new OfferNotAvailableError("Offer is no longer available");
    }
    const helperId = offer.responderId;

    const claimed = await tx.sOSAlert.updateMany({
      where: { id: alertId, assignedHelperId: null, status: "ACTIVE" },
      data: { assignedHelperId: helperId, nextEscalationAt: null },
    });
    if (claimed.count === 0) throw new AlreadyAssignedError("Alert already has an assigned helper");

    const acceptedOffer = await tx.sOSAlertResponse.updateMany({
      where: { id: offerId, status: "OFFERED" },
      data: { status: "ACCEPTED", respondedAt: new Date(), respondedBy: actorId },
    });
    if (acceptedOffer.count === 0) throw new OfferNotAvailableError("Offer is no longer available");

    await tx.sOSAlertResponse.updateMany({
      where: { alertId, id: { not: offerId }, status: "OFFERED" },
      data: { status: "EXPIRED" },
    });

    const alert = await tx.sOSAlert.findUniqueOrThrow({ where: { id: alertId } });

    // Reuses the Community Platform's existing chat model — a session is not a new chat
    // system, just two participants on a plain Conversation.
    const conversation = await tx.conversation.create({
      data: {
        subject: `SOS: ${alert.type}`,
        participants: {
          create: [
            { userId: alert.userId, role: "ORGANIZER" },
            { userId: helperId, role: "MEMBER" },
          ],
        },
      },
    });

    const session = await tx.sOSSession.create({
      data: { alertId, helperId, riderId: alert.userId, offerId, conversationId: conversation.id },
    });

    await tx.sOSTimelineEvent.create({
      data: {
        alertId,
        sessionId: session.id,
        type: "HELPER_ACCEPTED",
        actorId,
        metadata: { helperId, offerId },
      },
    });

    return session;
  });
}

export async function getSessionById(sessionId: string) {
  return prisma.sOSSession.findUnique({
    where: { id: sessionId },
    include: {
      alert: true,
      helper: { select: { id: true, name: true, phone: true, email: true } },
      rider: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
}

export async function getActiveSessionForAlert(alertId: string) {
  return prisma.sOSSession.findFirst({
    where: { alertId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    orderBy: { startedAt: "desc" },
    include: {
      helper: { select: { id: true, name: true, phone: true, email: true } },
      rider: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
}

const STATUS_TIMESTAMP_FIELD = {
  HELPER_ARRIVED: "helperArrivedAt",
  ASSISTANCE_IN_PROGRESS: "assistanceStartedAt",
  COMPLETED: "completedAt",
  CANCELLED: "cancelledAt",
} as const;

export async function updateSessionStatus(
  sessionId: string,
  status: "HELPER_ARRIVED" | "ASSISTANCE_IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  cancelReason?: string,
) {
  const field = STATUS_TIMESTAMP_FIELD[status];
  const session = await prisma.sOSSession.update({
    where: { id: sessionId },
    data: { status, [field]: new Date(), ...(status === "CANCELLED" ? { cancelReason } : {}) },
  });

  // Cancelling a session re-opens the alert for a new offer instead of leaving it permanently
  // stuck with a dead assignment — the escalation ticker will pick it back up on its next tick.
  if (status === "CANCELLED") {
    await prisma.sOSAlert.update({
      where: { id: session.alertId },
      data: { assignedHelperId: null, nextEscalationAt: new Date() },
    });
  }

  return session;
}

export async function submitRating(sessionId: string, rating: number, comment?: string) {
  return prisma.sOSSession.update({
    where: { id: sessionId },
    data: { rating, ratingComment: comment },
  });
}
