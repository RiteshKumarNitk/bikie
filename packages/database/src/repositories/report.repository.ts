import { prisma } from "../client";

export async function create(params: {
  reporterId: string;
  targetType: "MESSAGE" | "USER" | "TRIP" | "CONVERSATION" | "GROUP";
  targetId: string;
  reason: "SPAM" | "ABUSE" | "FAKE_ACCOUNT" | "DANGEROUS_BEHAVIOUR" | "HARASSMENT" | "SCAM" | "OTHER";
  details?: string;
}) {
  return prisma.report.create({ data: params });
}

export async function findMany(filters: { status?: string; targetType?: string }) {
  return prisma.report.findMany({
    where: {
      status: filters.status as never,
      targetType: filters.targetType as never,
    },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.report.findUnique({ where: { id } });
}

export async function findByIdWithRelations(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateStatus(
  id: string,
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED",
  reviewedById: string,
  resolutionNote?: string,
) {
  return prisma.report.update({
    where: { id },
    data: { status, reviewedById, reviewedAt: new Date(), resolutionNote },
  });
}
