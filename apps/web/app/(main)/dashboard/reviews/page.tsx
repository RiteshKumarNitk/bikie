import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Reviews" };

export default async function DashboardReviewsPage() {
  const { reviews } = await getJson<{ reviews: ReviewDTO[] }>("/api/reviews/mine", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Reviews</h1>
      {reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="You haven't reviewed any bikes yet" description="Reviews unlock after a completed booking." />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-3xl bg-card p-5">
              <div className="flex items-center justify-between">
                <Link href={`/bikes/${review.bike?.slug}`} className="font-medium hover:text-accent-text">
                  {review.bike?.name}
                </Link>
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
