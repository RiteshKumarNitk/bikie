import type { BikeSummaryDTO, CategoryDTO, DestinationSummaryDTO, TestimonialDTO, TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Hero } from "@/components/home/Hero";
import { PanicButtonSection } from "@/components/home/PanicButtonSection";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { Categories } from "@/components/home/Categories";
import { FeaturedBikes } from "@/components/home/FeaturedBikes";
import { UpcomingRides } from "@/components/home/UpcomingRides";
import { WhyBikie } from "@/components/home/WhyBikie";
import { Community } from "@/components/home/Community";
import { Testimonials } from "@/components/home/Testimonials";
import { PartnerTeaser } from "@/components/home/PartnerTeaser";
import { FAQ } from "@/components/home/FAQ";

export default async function HomePage() {
  const [bikesRes, destinationsRes, categoriesRes, testimonialsRes, tripsRes] = await Promise.all([
    getJson<{ bikes: BikeSummaryDTO[] }>("/api/bikes/featured?limit=8"),
    getJson<{ destinations: DestinationSummaryDTO[] }>("/api/destinations/popular?limit=6"),
    getJson<{ categories: CategoryDTO[] }>("/api/categories"),
    getJson<{ testimonials: TestimonialDTO[] }>("/api/testimonials?limit=6"),
    getJson<{ trips: TripSummaryDTO[] }>("/api/trips?tab=upcoming"),
  ]);

  return (
    <>
      <PanicButtonSection />
      <Hero />
      <PopularDestinations destinations={destinationsRes.destinations} />
      <Categories categories={categoriesRes.categories} />
      <FeaturedBikes bikes={bikesRes.bikes} />
      <UpcomingRides trips={tripsRes.trips.slice(0, 4)} />
      <WhyBikie />
      <Community />
      <Testimonials testimonials={testimonialsRes.testimonials} />
      <PartnerTeaser />
      <FAQ />
    </>
  );
}
