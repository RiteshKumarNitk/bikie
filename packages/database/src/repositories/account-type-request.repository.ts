import { prisma } from "../client";

const USER_SELECT = {
  select: { id: true, name: true, phoneNumber: true, phone: true, accountType: true },
} as const;

function toDTO(request: {
  id: string;
  userId: string;
  user: { id: string; name: string; phoneNumber: string | null; phone: string | null; accountType: string };
  currentType: string;
  requestedType: string;
  reason: string;
  supportingInfo: string | null;
  status: string;
  adminRemarks: string | null;
  reviewedById: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: request.id,
    userId: request.userId,
    user: {
      id: request.user.id,
      name: request.user.name,
      phone: request.user.phoneNumber ?? request.user.phone,
      accountType: request.user.accountType,
    },
    currentType: request.currentType,
    requestedType: request.requestedType,
    reason: request.reason,
    supportingInfo: request.supportingInfo,
    status: request.status,
    adminRemarks: request.adminRemarks,
    reviewedById: request.reviewedById,
    reviewedByName: request.reviewedBy?.name ?? null,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export async function createRequest(data: {
  userId: string;
  currentType: string;
  requestedType: string;
  reason: string;
  supportingInfo?: string;
}) {
  const request = await prisma.accountTypeChangeRequest.create({
    data: {
      userId: data.userId,
      currentType: data.currentType as any,
      requestedType: data.requestedType as any,
      reason: data.reason,
      supportingInfo: data.supportingInfo,
    },
    include: { user: USER_SELECT, reviewedBy: { select: { id: true, name: true } } },
  });
  return toDTO(request);
}

/** One open (PENDING/MORE_INFORMATION_REQUIRED) request per user at a time — a second submission
 * while one is already open should be rejected by the caller, not silently create a duplicate. */
export async function findOpenRequestForUser(userId: string) {
  return prisma.accountTypeChangeRequest.findFirst({
    where: { userId, status: { in: ["PENDING", "MORE_INFORMATION_REQUIRED"] } },
    select: { id: true },
  });
}

export async function findRequestsForUser(userId: string) {
  const requests = await prisma.accountTypeChangeRequest.findMany({
    where: { userId },
    include: { user: USER_SELECT, reviewedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toDTO);
}

export async function findAllRequests(status?: string) {
  const requests = await prisma.accountTypeChangeRequest.findMany({
    where: status ? { status: status as any } : undefined,
    include: { user: USER_SELECT, reviewedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toDTO);
}

export async function findRequestById(id: string) {
  const request = await prisma.accountTypeChangeRequest.findUnique({
    where: { id },
    include: { user: USER_SELECT, reviewedBy: { select: { id: true, name: true } } },
  });
  return request ? toDTO(request) : null;
}

export type AccountTypeRequestDecision = "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED";

export type ReviewRequestResult =
  | { ok: true; userId: string; requestedType: string; decision: AccountTypeRequestDecision }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION"; currentStatus?: string };

/** The one place an Account Type Change Request is decided. `APPROVED` atomically also writes
 * the new `User.accountType` in the same transaction — this is the only non-registration path
 * that ever changes it (ADR-053, no self-service switch). */
export async function reviewRequest(
  id: string,
  decision: AccountTypeRequestDecision,
  opts: { adminRemarks?: string; adminUserId: string },
): Promise<ReviewRequestResult> {
  return prisma.$transaction(async (tx) => {
    const request = await tx.accountTypeChangeRequest.findUnique({ where: { id } });
    if (!request) return { ok: false, reason: "NOT_FOUND" };
    if (!["PENDING", "MORE_INFORMATION_REQUIRED"].includes(request.status)) {
      return { ok: false, reason: "INVALID_TRANSITION", currentStatus: request.status };
    }

    await tx.accountTypeChangeRequest.update({
      where: { id },
      data: {
        status: decision as any,
        adminRemarks: opts.adminRemarks ?? null,
        reviewedById: opts.adminUserId,
        reviewedAt: new Date(),
      },
    });

    if (decision === "APPROVED") {
      await tx.user.update({
        where: { id: request.userId },
        data: { accountType: request.requestedType },
      });
    }

    return { ok: true, userId: request.userId, requestedType: request.requestedType, decision };
  });
}
