import type { BikeSummaryDTO, CategoryDTO, DestinationSummaryDTO, TestimonialDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Hero } from "@/components/home/Hero";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { Categories } from "@/components/home/Categories";
import { FeaturedBikes } from "@/components/home/FeaturedBikes";
import { WhyBikie } from "@/components/home/WhyBikie";
import { Community } from "@/components/home/Community";
import { Testimonials } from "@/components/home/Testimonials";
import { PartnerTeaser } from "@/components/home/PartnerTeaser";
import { FAQ } from "@/components/home/FAQ";

export default async function HomePage() {
  const [bikesRes, destinationsRes, categoriesRes, testimonialsRes] = await Promise.all([
    getJson<{ bikes: BikeSummaryDTO[] }>("/api/bikes/featured?limit=8"),
    getJson<{ destinations: DestinationSummaryDTO[] }>("/api/destinations/popular?limit=6"),
    getJson<{ categories: CategoryDTO[] }>("/api/categories"),
    getJson<{ testimonials: TestimonialDTO[] }>("/api/testimonials?limit=6"),
  ]);

  return (
    <>
      <Hero />
      <PopularDestinations destinations={destinationsRes.destinations} />
      <Categories categories={categoriesRes.categories} />
      <FeaturedBikes bikes={bikesRes.bikes} />
      <WhyBikie />
      <Community />
      <Testimonials testimonials={testimonialsRes.testimonials} />
      <PartnerTeaser />
      <FAQ />
    </>
  );
}
