import type { MetadataRoute } from "next";
import type { BikeSearchResultDTO, DestinationSummaryDTO, TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";
import { blogPosts } from "@/lib/blog-data";

// Matches the revalidate window used by the read-only content routes this
// pulls from (see .docs/API.md — categories/destinations/bikes/testimonials
// are all revalidate: 300).
export const revalidate = 300;

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const STATIC_ROUTES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/explore-bikes", changeFrequency: "daily", priority: 0.9 },
  { path: "/destinations", changeFrequency: "weekly", priority: 0.8 },
  { path: "/trips", changeFrequency: "daily", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.6 },
  { path: "/clubs", changeFrequency: "weekly", priority: 0.5 },
  { path: "/community", changeFrequency: "weekly", priority: 0.5 },
  { path: "/events", changeFrequency: "weekly", priority: 0.5 },
  { path: "/adventure-bikes", changeFrequency: "monthly", priority: 0.6 },
  { path: "/bikes-in-goa", changeFrequency: "monthly", priority: 0.6 },
  { path: "/bikes-in-jaipur", changeFrequency: "monthly", priority: 0.6 },
  { path: "/royal-enfield-rentals", changeFrequency: "monthly", priority: 0.6 },
  { path: "/gift-cards", changeFrequency: "monthly", priority: 0.4 },
  { path: "/safety-center", changeFrequency: "monthly", priority: 0.4 },
  { path: "/roadside-assistance", changeFrequency: "monthly", priority: 0.4 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.3 },
  { path: "/press", changeFrequency: "monthly", priority: 0.3 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "/partners/benefits", changeFrequency: "monthly", priority: 0.4 },
  { path: "/partners/pricing", changeFrequency: "monthly", priority: 0.4 },
  { path: "/partners/services", changeFrequency: "monthly", priority: 0.4 },
  { path: "/partners/success-stories", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.2 },
];

const TRIP_TABS = [
  "upcoming",
  "weekend",
  "adventure",
  "road-trip",
  "international",
  "guided-tour",
  "completed",
] as const;

async function getAllBikeSlugs(): Promise<string[]> {
  try {
    const first = await getJson<BikeSearchResultDTO>("/api/bikes?pageSize=48");
    const slugs = first.bikes.map((b) => b.slug);
    const totalPages = Math.ceil(first.total / first.pageSize);
    if (totalPages <= 1) return slugs;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        getJson<BikeSearchResultDTO>(`/api/bikes?pageSize=48&page=${i + 2}`).catch(
          () => ({ bikes: [], total: 0, page: 1, pageSize: 48 }) as BikeSearchResultDTO,
        ),
      ),
    );
    return [...slugs, ...rest.flatMap((r) => r.bikes.map((b) => b.slug))];
  } catch {
    return [];
  }
}

async function getAllDestinationSlugs(): Promise<string[]> {
  try {
    const { destinations } = await getJson<{ destinations: DestinationSummaryDTO[] }>("/api/destinations");
    return destinations.map((d) => d.slug);
  } catch {
    return [];
  }
}

async function getAllTripSlugs(): Promise<string[]> {
  try {
    const perTab = await Promise.all(
      TRIP_TABS.map((tab) =>
        getJson<{ trips: TripSummaryDTO[] }>(`/api/trips?tab=${tab}`).catch(
          () => ({ trips: [] as TripSummaryDTO[] }),
        ),
      ),
    );
    const slugs = new Set<string>();
    for (const { trips } of perTab) {
      for (const trip of trips) slugs.add(trip.slug);
    }
    return [...slugs];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [bikeSlugs, destinationSlugs, tripSlugs] = await Promise.all([
    getAllBikeSlugs(),
    getAllDestinationSlugs(),
    getAllTripSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const bikeEntries: MetadataRoute.Sitemap = bikeSlugs.map((slug) => ({
    url: `${siteUrl}/bikes/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const destinationEntries: MetadataRoute.Sitemap = destinationSlugs.map((slug) => ({
    url: `${siteUrl}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tripEntries: MetadataRoute.Sitemap = tripSlugs.map((slug) => ({
    url: `${siteUrl}/trips/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...bikeEntries, ...destinationEntries, ...tripEntries, ...blogEntries];
}
