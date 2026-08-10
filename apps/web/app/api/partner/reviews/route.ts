import { NextResponse } from "next/server";
import { ReviewService, PartnerService } from "@bikie/services";
import { requirePartnerCapability } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const [reviews, providerReviews] = await Promise.all([
    ReviewService.getForOwner(session.user.id),
    PartnerService.getProviderReviews(session.user.id),
  ]);
  return NextResponse.json({ reviews, providerReviews });
}
