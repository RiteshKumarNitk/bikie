import { prisma } from "../client";

export async function findFeaturedTestimonials(limit: number) {
  const testimonials = await prisma.testimonial.findMany({
    where: { isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return testimonials.map((testimonial) => ({
    id: testimonial.id,
    authorName: testimonial.authorName,
    authorAvatarUrl: testimonial.authorAvatarUrl,
    authorLocation: testimonial.authorLocation,
    rating: testimonial.rating,
    quote: testimonial.quote,
  }));
}
