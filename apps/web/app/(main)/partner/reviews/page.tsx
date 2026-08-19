import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewDTO } from "@bikie/types";
import { getJsonOrFallback } from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { MembershipRequiredNotice } from "@/components/partner/PartnerMembershipStatus";

export const metadata: Metadata = { title: "Reviews" };

interface ProviderReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  rider: { id: string; name: string };
}

export default async function PartnerReviewsPage() {
  const data = await getJsonOrFallback<{ reviews: ReviewDTO[]; providerReviews?: ProviderReviewRow[] }>(
    "/api/partner/reviews",
    { reviews: [], providerReviews: [] },
    { auth: true },
  );
  const reviews = data.reviews ?? [];
  const providerReviews = data.providerReviews ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <MembershipRequiredNotice feature="Reviews" />

      {providerReviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium">Service Reviews ({providerReviews.length})</h2>
          <p className="mt-1 text-sm text-foreground/50">
            Reviews from riders you&apos;ve helped through SOS assistance.
          </p>
          <div className="mt-4 space-y-4">
            {providerReviews.map((r) => (
              <div key={r.id} className="rounded-3xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.rider.name}</p>
                  <p className="text-accent-text">{"★".repeat(r.rating)}</p>
                </div>
                {r.comment && <p className="mt-2 text-sm text-foreground/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-medium">Bike Rental Reviews</h2>
        {reviews.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No bike rental reviews yet" description="Reviews from renters will appear here after completed bookings." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
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
    </div>
  );
}
