import { prisma } from "../client";

export async function findReviewByBookingId(bookingId: string) {
  return prisma.review.findUnique({ where: { bookingId } });
}

export async function createReview(data: { userId: string; bikeId: string; bookingId: string; rating: number; comment: string }) {
  const review = await prisma.review.create({
    data: {
      userId: data.userId,
      bikeId: data.bikeId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment,
    },
    include: { user: true },
  });
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    author: { name: review.user.name, image: review.user.image },
  };
}

export async function findReviewsForBike(bikeId: string) {
  const reviews = await prisma.review.findMany({
    where: { bikeId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    author: { name: review.user.name, image: review.user.image },
  }));
}

export async function findReviewsForOwner(ownerId: string) {
  const reviews = await prisma.review.findMany({
    where: { bike: { ownerId } },
    orderBy: { createdAt: "desc" },
    include: { user: true, bike: true },
  });
  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    author: { name: review.user.name, image: review.user.image },
    bike: { slug: review.bike.slug, name: review.bike.name },
  }));
}

export async function findReviewsByUser(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: true, bike: true },
  });
  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    author: { name: review.user.name, image: review.user.image },
    bike: { slug: review.bike.slug, name: review.bike.name },
  }));
}
