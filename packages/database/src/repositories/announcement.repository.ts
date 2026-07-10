import { prisma } from "../client";

export async function create(tripId: string, authorId: string, content: string) {
  return prisma.announcement.create({
    data: { tripId, authorId, content },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function findForTrip(tripId: string) {
  return prisma.announcement.findMany({
    where: { tripId },
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function findById(id: string) {
  return prisma.announcement.findUnique({ where: { id } });
}

export async function remove(id: string) {
  await prisma.announcement.delete({ where: { id } });
}

export async function findMediaForConversation(conversationId: string, type?: "IMAGE" | "DOCUMENT") {
  return prisma.messageAttachment.findMany({
    where: {
      type,
      message: { conversationId, deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
  });
}
