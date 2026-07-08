import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Adventure", slug: "adventure", type: "ADVENTURE" as const, sortOrder: 1, imageUrl: "https://picsum.photos/seed/cat-adventure/400/400" },
  { name: "Cruiser", slug: "cruiser", type: "CRUISER" as const, sortOrder: 2, imageUrl: "https://picsum.photos/seed/cat-cruiser/400/400" },
  { name: "Royal Enfield", slug: "royal-enfield", type: "ROYAL_ENFIELD" as const, sortOrder: 3, imageUrl: "https://picsum.photos/seed/cat-re/400/400" },
  { name: "Sports", slug: "sports", type: "SPORTS" as const, sortOrder: 4, imageUrl: "https://picsum.photos/seed/cat-sports/400/400" },
  { name: "Scooter", slug: "scooter", type: "SCOOTER" as const, sortOrder: 5, imageUrl: "https://picsum.photos/seed/cat-scooter/400/400" },
  { name: "Electric", slug: "electric", type: "ELECTRIC" as const, sortOrder: 6, imageUrl: "https://picsum.photos/seed/cat-electric/400/400" },
  { name: "Touring", slug: "touring", type: "TOURING" as const, sortOrder: 7, imageUrl: "https://picsum.photos/seed/cat-touring/400/400" },
  { name: "Luxury", slug: "luxury", type: "LUXURY" as const, sortOrder: 8, imageUrl: "https://picsum.photos/seed/cat-luxury/400/400" },
  { name: "Off Road", slug: "off-road", type: "OFF_ROAD" as const, sortOrder: 9, imageUrl: "https://picsum.photos/seed/cat-offroad/400/400" },
];

const destinations = [
  { name: "Leh Ladakh", slug: "leh-ladakh", state: "Ladakh", bikeCount: 24, imageUrl: "https://picsum.photos/seed/dest-ladakh/800/600" },
  { name: "Spiti Valley", slug: "spiti-valley", state: "Himachal Pradesh", bikeCount: 18, imageUrl: "https://picsum.photos/seed/dest-spiti/800/600" },
  { name: "Goa", slug: "goa", state: "Goa", bikeCount: 42, imageUrl: "https://picsum.photos/seed/dest-goa/800/600" },
  { name: "Coorg", slug: "coorg", state: "Karnataka", bikeCount: 15, imageUrl: "https://picsum.photos/seed/dest-coorg/800/600" },
  { name: "Rishikesh", slug: "rishikesh", state: "Uttarakhand", bikeCount: 21, imageUrl: "https://picsum.photos/seed/dest-rishikesh/800/600" },
  { name: "Munnar", slug: "munnar", state: "Kerala", bikeCount: 12, imageUrl: "https://picsum.photos/seed/dest-munnar/800/600" },
];

const bikes = [
  { name: "Himalayan 450", brand: "Royal Enfield", category: "adventure", city: "Leh", price: 1799, image: "https://picsum.photos/seed/bike-himalayan/800/600" },
  { name: "Continental GT", brand: "Royal Enfield", category: "royal-enfield", city: "Goa", price: 1499, image: "https://picsum.photos/seed/bike-continental/800/600" },
  { name: "Duke 390", brand: "KTM", category: "sports", city: "Bangalore", price: 1699, image: "https://picsum.photos/seed/bike-duke/800/600" },
  { name: "Meteor 350", brand: "Royal Enfield", category: "cruiser", city: "Jaipur", price: 1299, image: "https://picsum.photos/seed/bike-meteor/800/600" },
  { name: "Activa 6G", brand: "Honda", category: "scooter", city: "Mumbai", price: 599, image: "https://picsum.photos/seed/bike-activa/800/600" },
  { name: "Ather 450X", brand: "Ather", category: "electric", city: "Chennai", price: 899, image: "https://picsum.photos/seed/bike-ather/800/600" },
  { name: "Versys 650", brand: "Kawasaki", category: "touring", city: "Manali", price: 2499, image: "https://picsum.photos/seed/bike-versys/800/600" },
  { name: "Interceptor 650", brand: "Royal Enfield", category: "cruiser", city: "Rishikesh", price: 1899, image: "https://picsum.photos/seed/bike-interceptor/800/600" },
  { name: "Panigale V2", brand: "Ducati", category: "luxury", city: "Delhi", price: 5999, image: "https://picsum.photos/seed/bike-panigale/800/600" },
  { name: "XPulse 200", brand: "Hero", category: "off-road", city: "Coorg", price: 999, image: "https://picsum.photos/seed/bike-xpulse/800/600" },
];

const testimonials = [
  { authorName: "Aditya Rao", authorLocation: "Bangalore", rating: 5, quote: "Booked a Himalayan in ten minutes and rode Ladakh a week later. The whole experience felt effortless.", avatar: "https://i.pravatar.cc/150?img=12" },
  { authorName: "Priya Nair", authorLocation: "Kochi", rating: 5, quote: "Way better than the usual rental shop scramble. The bike was exactly as pictured and pickup was seamless.", avatar: "https://i.pravatar.cc/150?img=32" },
  { authorName: "Rohan Mehta", authorLocation: "Pune", rating: 4, quote: "Loved the curated destination guides — found a coastal route in Goa I'd never have discovered otherwise.", avatar: "https://i.pravatar.cc/150?img=45" },
  { authorName: "Simran Kaur", authorLocation: "Delhi", rating: 5, quote: "Felt premium from search to pickup. This is what Indian road trips have been missing.", avatar: "https://i.pravatar.cc/150?img=47" },
  { authorName: "Karthik Iyer", authorLocation: "Chennai", rating: 5, quote: "Instant booking, transparent pricing, and a genuinely well-maintained bike. Will use again.", avatar: "https://i.pravatar.cc/150?img=51" },
  { authorName: "Neha Verma", authorLocation: "Jaipur", rating: 4, quote: "The Spiti Valley trip planning tips alone were worth it. Smooth rental process too.", avatar: "https://i.pravatar.cc/150?img=25" },
];

async function main() {
  const categoryRecords: Record<string, { id: string }> = {};
  for (const c of categories) {
    const record = await prisma.category.upsert({
      where: { type: c.type },
      update: {},
      create: c,
    });
    categoryRecords[c.slug] = record;
  }

  const destinationRecords: Record<string, { id: string }> = {};
  for (const d of destinations) {
    const record = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: { ...d, isPopular: true },
    });
    destinationRecords[d.slug] = record;
  }

  const destinationSlugs = Object.keys(destinationRecords);
  for (let i = 0; i < bikes.length; i++) {
    const b = bikes[i];
    const destinationSlug = destinationSlugs[i % destinationSlugs.length];
    await prisma.bike.upsert({
      where: { slug: b.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        slug: b.name.toLowerCase().replace(/\s+/g, "-"),
        name: b.name,
        brand: b.brand,
        categoryId: categoryRecords[b.category].id,
        destinationId: destinationRecords[destinationSlug].id,
        pricePerDay: b.price,
        city: b.city,
        imageUrl: b.image,
        ratingAvg: 4.5 + (i % 2) * 0.4,
        ratingCount: 20 + i * 7,
        isFeatured: true,
      },
    });
  }

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (!existing) {
      await prisma.testimonial.create({
        data: {
          authorName: t.authorName,
          authorLocation: t.authorLocation,
          authorAvatarUrl: t.avatar,
          rating: t.rating,
          quote: t.quote,
          isFeatured: true,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
