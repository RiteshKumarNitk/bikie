import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client.js";

export async function findReviewByBookingId(bookingId: string) {
  return prisma.review.findUnique({ where: { bookingId } });
}

/** Returns null (instead of throwing) if a review for this booking already exists —
 * relies on the Review.bookingId unique constraint to catch the race a check-then-create
 * from the service layer can't close on its own. */
export async function createReview(data: { userId: string; bikeId: string; bookingId: string; rating: number; comment: string }) {
  try {
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return null;
    }
    throw err;
  }
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
