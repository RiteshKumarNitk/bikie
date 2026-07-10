import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Reviews" };

export default async function PartnerReviewsPage() {
  const { reviews } = await getJson<{ reviews: ReviewDTO[] }>("/api/partner/reviews", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>
      {reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No reviews yet" description="Reviews from renters will appear here after completed bookings." />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-3xl bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/bikes/${review.bike?.slug}`} className="font-medium hover:text-accent-text">
                    {review.bike?.name}
                  </Link>
                  <p className="text-xs text-foreground/50">by {review.author.name}</p>
                </div>
                <p className="text-accent-text">{"★".repeat(review.rating)}</p>
              </div>
              <p className="mt-2 text-sm text-foreground/70">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
