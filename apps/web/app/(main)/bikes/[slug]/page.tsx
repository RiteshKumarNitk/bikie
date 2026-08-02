import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { BikeDetailDTO, BikeSearchResultDTO, ReviewDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";
import { formatCurrency } from "@bikie/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeCard } from "@/components/shared/BikeCard";
import { BikeGallery } from "@/components/bikes/BikeGallery";
import { BookingCard } from "@/components/bikes/BookingCard";

async function getBike(slug: string) {
  try {
    const { bike } = await getJson<{ bike: BikeDetailDTO }>(`/api/bikes/${slug}`);
    return bike;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bike = await getBike(slug);
  if (!bike) return { title: "Bike Not Found" };
  return {
    title: `${bike.name} — Rent in ${bike.city}`,
    description: bike.description ?? `Rent the ${bike.brand} ${bike.name} in ${bike.city}, from ${formatCurrency(bike.pricePerDay)}/day on BIKIE.`,
  };
}

function bikeJsonLd(bike: BikeDetailDTO) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bike.name,
    brand: { "@type": "Brand", name: bike.brand },
    image: bike.gallery.length > 0 ? bike.gallery : [bike.imageUrl],
    description:
      bike.description ?? `Rent the ${bike.brand} ${bike.name} in ${bike.city}, from ${formatCurrency(bike.pricePerDay)}/day on BIKIE.`,
    ...(bike.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: bike.ratingAvg,
            reviewCount: bike.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/bikes/${bike.slug}`,
      priceCurrency: "INR",
      price: bike.pricePerDay,
      availability: bike.instantBooking ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
    },
  };
}

const specRows = (bike: BikeDetailDTO) =>
  [
    bike.engineCc && { label: "Engine", value: `${bike.engineCc}cc` },
    bike.mileageKmpl && { label: "Mileage", value: `${bike.mileageKmpl} km/l` },
    bike.fuelTankLitres && { label: "Fuel Tank", value: `${bike.fuelTankLitres} L` },
    { label: "ABS", value: bike.hasAbs ? "Dual channel" : "Not equipped" },
    bike.seatHeightMm && { label: "Seat Height", value: `${bike.seatHeightMm} mm` },
    bike.luggageCapacityL && { label: "Luggage Capacity", value: `${bike.luggageCapacityL} L` },
    { label: "Helmet", value: bike.helmetIncluded ? "Included" : "Not included" },
    { label: "Delivery", value: bike.deliveryAvailable ? "Available" : "Pickup only" },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

export default async function BikeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bike = await getBike(slug);
  if (!bike) notFound();

  const [{ reviews }, related] = await Promise.all([
    getJson<{ reviews: ReviewDTO[] }>(`/api/bikes/${slug}/reviews`).catch(() => ({ reviews: [] as ReviewDTO[] })),
    getJson<BikeSearchResultDTO>(`/api/bikes?category=${bike.category.slug}&pageSize=4`).catch(
      () => ({ bikes: [], total: 0, page: 1, pageSize: 4 }) as BikeSearchResultDTO,
    ),
  ]);
  const relatedBikes = related.bikes.filter((b) => b.slug !== bike.slug).slice(0, 4);

  return (
    <div className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bikeJsonLd(bike)) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Rent a Bike", href: "/explore-bikes" },
          { label: bike.name },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <BikeGallery images={bike.gallery} alt={bike.name} />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">{bike.name}</h1>
                <p className="mt-1 text-foreground/60">
                  {bike.brand} · {bike.city} · {bike.category.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">★ {bike.ratingAvg.toFixed(1)}</p>
                <p className="text-sm text-foreground/60">{bike.ratingCount} reviews</p>
              </div>
            </div>

            {bike.description && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">About this bike</h2>
                <p className="mt-2 text-foreground/70">{bike.description}</p>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-xl font-semibold">Specifications</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {specRows(bike).map((row) => (
                  <div key={row.label} className="rounded-2xl bg-card p-4">
                    <p className="text-xs text-foreground/50">{row.label}</p>
                    <p className="mt-1 font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold">What&apos;s included</h3>
                <ul className="mt-2 space-y-1 text-sm text-foreground/70">
                  <li>✓ Two helmets</li>
                  <li>✓ Basic insurance coverage</li>
                  <li>✓ 24/7 roadside assistance</li>
                  <li>✓ Unlimited kilometers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">What&apos;s not included</h3>
                <ul className="mt-2 space-y-1 text-sm text-foreground/70">
                  <li>✗ Fuel</li>
                  <li>✗ Toll & parking charges</li>
                  <li>✗ Damage beyond normal wear</li>
                </ul>
              </div>
            </section>

            <section className="mt-8">
              <h3 className="font-semibold">Pickup instructions</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Pickup from the {bike.city} hub between 8 AM – 8 PM. Carry a valid driving license and
                government ID — both are verified at handover alongside a short vehicle walkthrough.
              </p>
            </section>

            <section className="mt-8">
              <h3 className="font-semibold">Cancellation policy</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Free cancellation up to 48 hours before pickup. Cancellations within 48 hours are
                refunded 50%, and no-shows forfeit the booking amount.
              </p>
            </section>

            <section className="mt-8">
              <h3 className="font-semibold">Safety guidelines</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Helmets are mandatory at all times. Review our full{" "}
                <a href="/safety-center" className="text-accent-text">
                  Safety Center
                </a>{" "}
                before setting off, especially for mountain routes.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-foreground/60">No reviews yet — be the first to ride and review.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-card p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{review.author.name}</p>
                        <p className="text-accent-text">{"★".repeat(review.rating)}</p>
                      </div>
                      <p className="mt-2 text-sm text-foreground/70">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div>
            <BookingCard bikeSlug={bike.slug} pricePerDay={bike.pricePerDay} securityDeposit={bike.securityDeposit} />
          </div>
        </div>

        {relatedBikes.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold">Related Bikes</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedBikes.map((related) => (
                <BikeCard key={related.id} bike={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
