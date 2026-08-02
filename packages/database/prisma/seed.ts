// Env vars come from the process (Docker compose env_file, dotenv-cli, or shell).
// Avoid importing `dotenv` here — it isn't a direct dependency of @bikie/database in the image.
import { prisma } from "../src/client";

const AUTH_BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";

const SEED_ACCOUNTS = {
  admin: { name: "BIKIE Admin", email: "admin@bikie.app", password: "Admin@12345" },
  partner: { name: "Arjun Rentals", email: "partner@bikie.app", password: "Partner@12345" },
  user: { name: "Demo Rider", email: "rider@bikie.app", password: "Rider@12345" },
  // Nearby riders used by the SOS fan-out E2E flow (see project doc / SOS testing guide).
  // Phones/emails are the live test WhatsApp + Gmail inboxes for local dispatch verification.
  nearby1: {
    name: "Nearby Rider One",
    email: "arun8107800370@gmail.com",
    password: "Nearby@12345",
    phone: "+918107800370",
  },
  nearby2: {
    name: "Nearby Rider Two",
    email: "sharmamo@gmail.com",
    password: "Nearby@12345",
    phone: "+919664361738",
  },
};

/** Fixed Bangalore coordinates for SOS E2E — trigger a panic with this GPS (or city "Bangalore")
 * so seeded nearby riders + the Bangalore partner are in range. */
const SOS_SEED_GPS = { lat: 12.9716, lng: 77.5946, city: "Bangalore" };

// Real password hashing (Better Auth's scrypt scheme) only happens through its own
// HTTP API, so seed accounts are created via the running dev server rather than
// inserted directly into User/Account — this guarantees they can actually log in.
async function signUpViaAuthApi(account: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing) return existing;

  const res = await fetch(`${AUTH_BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: AUTH_BASE_URL },
    body: JSON.stringify(account),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to seed account ${account.email}: ${res.status} ${await res.text()}. ` +
        `Is the dev server running at ${AUTH_BASE_URL}? Seed must run with 'pnpm dev' up.`,
    );
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
  return user;
}

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
  { name: "Leh Ladakh", slug: "leh-ladakh", state: "Ladakh", bikeCount: 24, imageUrl: "https://picsum.photos/seed/dest-ladakh/800/600", description: "High-altitude passes, glacial lakes, and the most iconic ride in India." },
  { name: "Spiti Valley", slug: "spiti-valley", state: "Himachal Pradesh", bikeCount: 18, imageUrl: "https://picsum.photos/seed/dest-spiti/800/600", description: "Cold desert monasteries and switchback mountain roads." },
  { name: "Goa", slug: "goa", state: "Goa", bikeCount: 42, imageUrl: "https://picsum.photos/seed/dest-goa/800/600", description: "Coastal highways, beach shacks, and easy scooter weekends." },
  { name: "Coorg", slug: "coorg", state: "Karnataka", bikeCount: 15, imageUrl: "https://picsum.photos/seed/dest-coorg/800/600", description: "Misty coffee estates and winding forest roads." },
  { name: "Rishikesh", slug: "rishikesh", state: "Uttarakhand", bikeCount: 21, imageUrl: "https://picsum.photos/seed/dest-rishikesh/800/600", description: "Himalayan foothills along the Ganges, gateway to Chopta and beyond." },
  { name: "Munnar", slug: "munnar", state: "Kerala", bikeCount: 12, imageUrl: "https://picsum.photos/seed/dest-munnar/800/600", description: "Tea-carpeted hills and hairpin bends in the Western Ghats." },
];

const bikeSpecs = {
  adventure: { engineCc: 452, mileageKmpl: 30, fuelTankLitres: 17, hasAbs: true, seatHeightMm: 825, luggageCapacityL: 40 },
  "royal-enfield": { engineCc: 349, mileageKmpl: 36, fuelTankLitres: 13, hasAbs: true, seatHeightMm: 795, luggageCapacityL: 20 },
  sports: { engineCc: 373, mileageKmpl: 28, fuelTankLitres: 13, hasAbs: true, seatHeightMm: 830, luggageCapacityL: 12 },
  cruiser: { engineCc: 349, mileageKmpl: 35, fuelTankLitres: 15, hasAbs: true, seatHeightMm: 765, luggageCapacityL: 25 },
  scooter: { engineCc: 109, mileageKmpl: 45, fuelTankLitres: 5, hasAbs: false, seatHeightMm: 765, luggageCapacityL: 18 },
  electric: { engineCc: null, mileageKmpl: null, fuelTankLitres: null, hasAbs: true, seatHeightMm: 765, luggageCapacityL: 22 },
  touring: { engineCc: 649, mileageKmpl: 22, fuelTankLitres: 21, hasAbs: true, seatHeightMm: 840, luggageCapacityL: 60 },
  luxury: { engineCc: 955, mileageKmpl: 15, fuelTankLitres: 17, hasAbs: true, seatHeightMm: 830, luggageCapacityL: 10 },
  "off-road": { engineCc: 199, mileageKmpl: 40, fuelTankLitres: 13, hasAbs: true, seatHeightMm: 825, luggageCapacityL: 15 },
} as const;

const bikes = [
  { name: "Himalayan 450", brand: "Royal Enfield", category: "adventure", city: "Leh", price: 1799, image: "https://picsum.photos/seed/bike-himalayan/800/600", description: "Built for the mountains — long-travel suspension and a torquey 452cc engine make it the default choice for Ladakh." },
  { name: "Continental GT", brand: "Royal Enfield", category: "royal-enfield", city: "Goa", price: 1499, image: "https://picsum.photos/seed/bike-continental/800/600", description: "A café-racer that's equally happy carving coastal curves as it is cruising the highway." },
  { name: "Duke 390", brand: "KTM", category: "sports", city: "Bangalore", price: 1699, image: "https://picsum.photos/seed/bike-duke/800/600", description: "Sharp, aggressive, and quick — the Duke rewards a spirited riding style." },
  { name: "Meteor 350", brand: "Royal Enfield", category: "cruiser", city: "Jaipur", price: 1299, image: "https://picsum.photos/seed/bike-meteor/800/600", description: "Relaxed ergonomics and a Tripper navigation pod make this an easy long-distance cruiser." },
  { name: "Activa 6G", brand: "Honda", category: "scooter", city: "Mumbai", price: 599, image: "https://picsum.photos/seed/bike-activa/800/600", description: "The reliable city companion — light, frugal, and effortless in traffic." },
  { name: "Ather 450X", brand: "Ather", category: "electric", city: "Chennai", price: 899, image: "https://picsum.photos/seed/bike-ather/800/600", description: "A quick, connected electric scooter for zero-emission city rides." },
  { name: "Versys 650", brand: "Kawasaki", category: "touring", city: "Manali", price: 2499, image: "https://picsum.photos/seed/bike-versys/800/600", description: "A parallel-twin tourer with the comfort and luggage capacity for multi-week trips." },
  { name: "Interceptor 650", brand: "Royal Enfield", category: "cruiser", city: "Rishikesh", price: 1899, image: "https://picsum.photos/seed/bike-interceptor/800/600", description: "Retro styling with a genuinely enjoyable parallel-twin engine — a modern classic." },
  { name: "Panigale V2", brand: "Ducati", category: "luxury", city: "Delhi", price: 5999, image: "https://picsum.photos/seed/bike-panigale/800/600", description: "Race-derived performance for riders who want the full superbike experience." },
  { name: "XPulse 200", brand: "Hero", category: "off-road", city: "Coorg", price: 999, image: "https://picsum.photos/seed/bike-xpulse/800/600", description: "Long suspension travel and switchable ABS make this the budget off-road pick." },
  { name: "Classic 350", brand: "Royal Enfield", category: "royal-enfield", city: "Udaipur", price: 1399, image: "https://picsum.photos/seed/bike-classic350/800/600", description: "The bike that defines the segment — thumping single-cylinder charm, unmistakable silhouette." },
  { name: "Dominar 400", brand: "Bajaj", category: "touring", city: "Spiti Valley", price: 1599, image: "https://picsum.photos/seed/bike-dominar/800/600", description: "A liquid-cooled tourer built for high-altitude passes and long days in the saddle." },
];

const testimonials = [
  { authorName: "Aditya Rao", authorLocation: "Bangalore", rating: 5, quote: "Booked a Himalayan in ten minutes and rode Ladakh a week later. The whole experience felt effortless.", avatar: "https://i.pravatar.cc/150?img=12" },
  { authorName: "Priya Nair", authorLocation: "Kochi", rating: 5, quote: "Way better than the usual rental shop scramble. The bike was exactly as pictured and pickup was seamless.", avatar: "https://i.pravatar.cc/150?img=32" },
  { authorName: "Rohan Mehta", authorLocation: "Pune", rating: 4, quote: "Loved the curated destination guides — found a coastal route in Goa I'd never have discovered otherwise.", avatar: "https://i.pravatar.cc/150?img=45" },
  { authorName: "Simran Kaur", authorLocation: "Delhi", rating: 5, quote: "Felt premium from search to pickup. This is what Indian road trips have been missing.", avatar: "https://i.pravatar.cc/150?img=47" },
  { authorName: "Karthik Iyer", authorLocation: "Chennai", rating: 5, quote: "Instant booking, transparent pricing, and a genuinely well-maintained bike. Will use again.", avatar: "https://i.pravatar.cc/150?img=51" },
  { authorName: "Neha Verma", authorLocation: "Jaipur", rating: 4, quote: "The Spiti Valley trip planning tips alone were worth it. Smooth rental process too.", avatar: "https://i.pravatar.cc/150?img=25" },
];

const tripsSeed = [
  { slug: "leh-ladakh-adventure-8-day", title: "Leh–Ladakh 8-Day Adventure", type: "ADVENTURE" as const, difficulty: "HARD" as const, price: 34999, seatsTotal: 12, destinationSlug: "leh-ladakh", daysFromNow: 30, durationDays: 8, image: "https://picsum.photos/seed/trip-ladakh/900/600", description: "Khardung La, Pangong Tso, and Nubra Valley over eight unforgettable days with a support vehicle and experienced ride captain." },
  { slug: "goa-weekend-coastal-ride", title: "Goa Weekend Coastal Ride", type: "WEEKEND" as const, difficulty: "EASY" as const, price: 6999, seatsTotal: 20, destinationSlug: "goa", daysFromNow: 12, durationDays: 2, image: "https://picsum.photos/seed/trip-goa/900/600", description: "A relaxed two-day loop through Goa's coastal highways, beach shacks, and sunset viewpoints." },
  { slug: "spiti-valley-road-trip", title: "Spiti Valley Road Trip", type: "ROAD_TRIP" as const, difficulty: "HARD" as const, price: 27999, seatsTotal: 10, destinationSlug: "spiti-valley", daysFromNow: 45, durationDays: 7, image: "https://picsum.photos/seed/trip-spiti/900/600", description: "Cold-desert monasteries, Chandratal Lake, and some of the most dramatic mountain roads in the world." },
  { slug: "rishikesh-himalayan-foothills", title: "Rishikesh Himalayan Foothills", type: "WEEKEND" as const, difficulty: "MODERATE" as const, price: 8999, seatsTotal: 16, destinationSlug: "rishikesh", daysFromNow: 20, durationDays: 3, image: "https://picsum.photos/seed/trip-rishikesh/900/600", description: "Riverside camping, Chopta meadows, and a gentle introduction to Himalayan riding." },
  { slug: "coorg-misty-hills-tour", title: "Coorg Misty Hills Tour", type: "GUIDED_TOUR" as const, difficulty: "EASY" as const, price: 7499, seatsTotal: 14, destinationSlug: "coorg", daysFromNow: 15, durationDays: 3, image: "https://picsum.photos/seed/trip-coorg/900/600", description: "A guided ride through coffee estates and waterfalls with a certified local tour guide." },
  { slug: "bhutan-international-expedition", title: "Bhutan International Expedition", type: "INTERNATIONAL" as const, difficulty: "MODERATE" as const, price: 89999, seatsTotal: 8, destinationSlug: null, daysFromNow: 75, durationDays: 10, image: "https://picsum.photos/seed/trip-bhutan/900/600", description: "Cross-border riding through the Land of the Thunder Dragon — permits, fuel, and border formalities handled for you." },
];

async function main() {
  console.log("Seeding auth accounts (requires 'pnpm dev' running on", AUTH_BASE_URL, ")...");
  const adminUser = await signUpViaAuthApi(SEED_ACCOUNTS.admin);
  const partnerUser = await signUpViaAuthApi(SEED_ACCOUNTS.partner);
  const demoUser = await signUpViaAuthApi(SEED_ACCOUNTS.user);

  await prisma.user.update({ where: { id: adminUser.id }, data: { role: "ADMIN" } });
  await prisma.user.update({ where: { id: partnerUser.id }, data: { role: "PARTNER" } });
  // demoUser stays RENTER (default)

  await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {
      city: SOS_SEED_GPS.city,
      contactPerson1Name: "Arjun Desk",
      contactPerson1Mobile: "+919876543210",
      contactPerson2Name: "Roadside Van",
      contactPerson2Mobile: "+919876543211",
    },
    create: {
      userId: partnerUser.id,
      businessName: "Arjun Rentals",
      type: "RENTAL",
      city: SOS_SEED_GPS.city,
      description: "Family-run motorcycle rental fleet — SOS test partner for Bangalore.",
      logoUrl: "https://picsum.photos/seed/partner-arjun/200/200",
      isVerified: true,
      ratingAvg: 4.7,
      ratingCount: 58,
      contactPerson1Name: "Arjun Desk",
      contactPerson1Mobile: "+919876543210",
      contactPerson2Name: "Roadside Van",
      contactPerson2Mobile: "+919876543211",
    },
  });

  await prisma.user.update({
    where: { id: partnerUser.id },
    data: { phone: "+919876543200" },
  });
  await prisma.user.update({
    where: { id: demoUser.id },
    data: { phone: "+919900001111", name: "Demo Rider" },
  });

  const categoryRecords: Record<string, { id: string }> = {};
  for (const c of categories) {
    categoryRecords[c.slug] = await prisma.category.upsert({ where: { type: c.type }, update: {}, create: c });
  }

  const destinationRecords: Record<string, { id: string }> = {};
  for (const d of destinations) {
    destinationRecords[d.slug] = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: { name: d.name, slug: d.slug, state: d.state, bikeCount: d.bikeCount, imageUrl: d.imageUrl, description: d.description, isPopular: true },
    });
  }

  const destinationSlugs = Object.keys(destinationRecords);
  const bikeRecords: { id: string }[] = [];
  for (let i = 0; i < bikes.length; i++) {
    const b = bikes[i];
    const destinationSlug = destinationSlugs[i % destinationSlugs.length];
    const specs = bikeSpecs[b.category as keyof typeof bikeSpecs];
    const slug = b.name.toLowerCase().replace(/\s+/g, "-");
    const bikeData = {
      name: b.name,
      brand: b.brand,
      categoryId: categoryRecords[b.category].id,
      destinationId: destinationRecords[destinationSlug].id,
      ownerId: i % 3 === 0 ? partnerUser.id : null,
      pricePerDay: b.price,
      securityDeposit: Math.round(b.price * 1.5),
      city: b.city,
      imageUrl: b.image,
      gallery: [b.image, b.image.replace("/800/600", "/801/600"), b.image.replace("/800/600", "/802/600")],
      ratingAvg: 4.5 + (i % 2) * 0.4,
      ratingCount: 20 + i * 7,
      isFeatured: i < 8,
      description: b.description,
      ...specs,
    };
    const record = await prisma.bike.upsert({
      where: { slug },
      update: bikeData,
      create: { slug, ...bikeData },
    });
    bikeRecords.push(record);
  }

  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (!exists) {
      await prisma.testimonial.create({
        data: { authorName: t.authorName, authorLocation: t.authorLocation, authorAvatarUrl: t.avatar, rating: t.rating, quote: t.quote, isFeatured: true },
      });
    }
  }

  // Bookings + reviews for the demo user
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const bookingSeed = [
    { bikeIndex: 0, status: "COMPLETED" as const, startOffset: -20, days: 4, review: { rating: 5, comment: "Ran perfectly through Ladakh's passes. Would rent again." } },
    { bikeIndex: 2, status: "COMPLETED" as const, startOffset: -8, days: 2, review: { rating: 4, comment: "Fun bike for a weekend blast, tyres could've had more grip." } },
    { bikeIndex: 4, status: "CONFIRMED" as const, startOffset: 5, days: 3, review: null },
    { bikeIndex: 6, status: "PENDING" as const, startOffset: 25, days: 6, review: null },
  ];
  for (const b of bookingSeed) {
    const bike = bikeRecords[b.bikeIndex];
    const startDate = new Date(now + b.startOffset * day);
    const endDate = new Date(startDate.getTime() + b.days * day);
    const bikeFull = await prisma.bike.findUniqueOrThrow({ where: { id: bike.id } });
    const existingBooking = await prisma.booking.findFirst({ where: { userId: demoUser.id, bikeId: bike.id, startDate } });
    const booking =
      existingBooking ??
      (await prisma.booking.create({
        data: {
          bikeId: bike.id,
          userId: demoUser.id,
          startDate,
          endDate,
          totalPrice: Number(bikeFull.pricePerDay) * b.days,
          status: b.status,
          pickupCity: bikeFull.city,
        },
      }));

    if (b.review) {
      const existingReview = await prisma.review.findUnique({ where: { bookingId: booking.id } });
      if (!existingReview) {
        await prisma.review.create({
          data: { bikeId: bike.id, userId: demoUser.id, bookingId: booking.id, rating: b.review.rating, comment: b.review.comment },
        });
      }
    }
  }

  // Wishlist for demo user
  for (const idx of [1, 5, 9]) {
    await prisma.wishlist.upsert({
      where: { userId_bikeId: { userId: demoUser.id, bikeId: bikeRecords[idx].id } },
      update: {},
      create: { userId: demoUser.id, bikeId: bikeRecords[idx].id },
    });
  }

  // Trips organized by the partner, demo user joins two of them
  const tripRecords: { id: string; slug: string }[] = [];
  for (const t of tripsSeed) {
    const startDate = new Date(now + t.daysFromNow * day);
    const endDate = new Date(startDate.getTime() + t.durationDays * day);
    const trip = await prisma.trip.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        imageUrl: t.image,
        gallery: [t.image],
        type: t.type,
        difficulty: t.difficulty,
        price: t.price,
        seatsTotal: t.seatsTotal,
        seatsLeft: t.seatsTotal - 3,
        startDate,
        endDate,
        organizerId: partnerUser.id,
        destinationId: t.destinationSlug ? destinationRecords[t.destinationSlug].id : null,
      },
    });
    tripRecords.push(trip);
  }

  for (const trip of [tripRecords[1], tripRecords[3]]) {
    await prisma.tripParticipant.upsert({
      where: { tripId_userId: { tripId: trip.id, userId: demoUser.id } },
      update: {},
      create: { tripId: trip.id, userId: demoUser.id, status: "APPROVED", decidedAt: new Date() },
    });
  }

  console.log("Seed complete.");
  // --- Seed Membership Plans ---
  const planCount = await prisma.membershipPlan.count();
  if (planCount === 0) {
    await prisma.membershipPlan.createMany({
      data: [
        {
          name: "Basic",
          description: "Essential coverage for occasional riders",
          price: 0,
          durationDays: 36500,
          benefits: ["Standard booking", "Email support", "Community access"],
          sortOrder: 0,
        },
        {
          name: "Premium",
          description: "Best value for regular riders",
          price: 999,
          durationDays: 365,
          benefits: ["Up to 15% off every booking", "Free cancellation", "Priority support", "Early access to trips", "Exclusive community rides", "Reward points on every ride"],
          sortOrder: 1,
        },
        {
          name: "Pro",
          description: "For power riders who want it all",
          price: 2499,
          durationDays: 365,
          benefits: ["Up to 25% off every booking", "Free cancellation & reschedule", "24/7 priority support", "Early access to all trips", "Exclusive Pro-only trips", "Double reward points", "Free delivery & pickup", "VIP roadside assistance"],
          sortOrder: 2,
        },
      ],
    });
    console.log("Seeded membership plans.");
  }

  // --- SOS E2E fixtures (membership + emergency contacts + nearby riders with GPS) ---
  console.log("Seeding SOS E2E fixtures around", SOS_SEED_GPS, "...");

  const premiumPlan = await prisma.membershipPlan.findFirst({ where: { name: "Premium" } });
  if (premiumPlan) {
    const existingMembership = await prisma.userMembership.findFirst({
      where: { userId: demoUser.id, status: "ACTIVE" },
    });
    if (!existingMembership) {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + premiumPlan.durationDays);
      await prisma.userMembership.create({
        data: {
          userId: demoUser.id,
          planId: premiumPlan.id,
          startDate: start,
          endDate: end,
          status: "ACTIVE",
        },
      });
      console.log("Seeded ACTIVE Premium membership for demo rider.");
    }
  }

  const riderProfile = await prisma.riderProfile.upsert({
    where: { userId: demoUser.id },
    update: { onboardingSkipped: false, area: "MG Road", district: SOS_SEED_GPS.city, pincode: "560001" },
    create: {
      userId: demoUser.id,
      addressLine: "12 MG Road",
      area: "MG Road",
      district: SOS_SEED_GPS.city,
      pincode: "560001",
      country: "India",
      bloodGroup: "O+",
      onboardingSkipped: false,
    },
  });

  await prisma.riderEmergencyContact.deleteMany({ where: { riderProfileId: riderProfile.id } });
  await prisma.riderEmergencyContact.createMany({
    data: [
      {
        riderProfileId: riderProfile.id,
        name: "Priya Demo (Spouse)",
        phone: "+919911112222",
        relation: "Spouse",
      },
      {
        riderProfileId: riderProfile.id,
        name: "Ravi Demo (Brother)",
        phone: "+919933334444",
        relation: "Brother",
      },
    ],
  });
  console.log("Seeded emergency contacts for demo rider.");

  const nearby1 = await signUpViaAuthApi(SEED_ACCOUNTS.nearby1);
  const nearby2 = await signUpViaAuthApi(SEED_ACCOUNTS.nearby2);

  // Also migrate older seed accounts that still use nearbyN@bikie.app.
  for (const legacy of ["nearby1@bikie.app", "nearby2@bikie.app"] as const) {
    const legacyUser = await prisma.user.findUnique({ where: { email: legacy } });
    if (!legacyUser) continue;
    const target = legacy.startsWith("nearby1") ? SEED_ACCOUNTS.nearby1 : SEED_ACCOUNTS.nearby2;
    const taken = await prisma.user.findUnique({ where: { email: target.email } });
    if (!taken) {
      await prisma.user.update({
        where: { id: legacyUser.id },
        data: { email: target.email, phone: target.phone, name: target.name },
      });
    } else {
      await prisma.user.update({
        where: { id: legacyUser.id },
        data: { phone: target.phone },
      });
    }
  }

  await prisma.user.update({
    where: { id: nearby1.id },
    data: { phone: SEED_ACCOUNTS.nearby1.phone, email: SEED_ACCOUNTS.nearby1.email, name: SEED_ACCOUNTS.nearby1.name },
  });
  await prisma.user.update({
    where: { id: nearby2.id },
    data: { phone: SEED_ACCOUNTS.nearby2.phone, email: SEED_ACCOUNTS.nearby2.email, name: SEED_ACCOUNTS.nearby2.name },
  });

  // Give nearby riders membership too so they can respond to alerts in the UI.
  if (premiumPlan) {
    for (const u of [nearby1, nearby2]) {
      const has = await prisma.userMembership.findFirst({ where: { userId: u.id, status: "ACTIVE" } });
      if (!has) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + premiumPlan.durationDays);
        await prisma.userMembership.create({
          data: { userId: u.id, planId: premiumPlan.id, startDate: start, endDate: end, status: "ACTIVE" },
        });
      }
    }
  }

  // Opt them into live location sharing ~1–2 km from the SOS seed point (PostGIS).
  const nearbyFixes: { userId: string; lat: number; lng: number }[] = [
    { userId: nearby1.id, lat: SOS_SEED_GPS.lat + 0.008, lng: SOS_SEED_GPS.lng + 0.006 },
    { userId: nearby2.id, lat: SOS_SEED_GPS.lat - 0.01, lng: SOS_SEED_GPS.lng + 0.004 },
    // Also put the demo rider's own fix on file so /dashboard/nearby works for them.
    { userId: demoUser.id, lat: SOS_SEED_GPS.lat, lng: SOS_SEED_GPS.lng },
  ];

  for (const fix of nearbyFixes) {
    await prisma.riderLocation.upsert({
      where: { userId: fix.userId },
      create: { userId: fix.userId, sharingEnabled: true },
      update: { sharingEnabled: true },
    });
    await prisma.$executeRaw`
      UPDATE "rider_location"
      SET "location" = ST_SetSRID(ST_MakePoint(${fix.lng}, ${fix.lat}), 4326)::geography,
          "updatedAt" = now(),
          "sharingEnabled" = true
      WHERE "userId" = ${fix.userId}
    `;
  }
  console.log("Seeded nearby rider GPS fixes (PostGIS) for SOS fan-out.");

  console.log("Admin:", SEED_ACCOUNTS.admin.email, "/", SEED_ACCOUNTS.admin.password);
  console.log("Partner:", SEED_ACCOUNTS.partner.email, "/", SEED_ACCOUNTS.partner.password);
  console.log("Demo user:", SEED_ACCOUNTS.user.email, "/", SEED_ACCOUNTS.user.password);
  console.log("Nearby1:", SEED_ACCOUNTS.nearby1.email, "/", SEED_ACCOUNTS.nearby1.password, "WA", SEED_ACCOUNTS.nearby1.phone);
  console.log("Nearby2:", SEED_ACCOUNTS.nearby2.email, "/", SEED_ACCOUNTS.nearby2.password, "WA", SEED_ACCOUNTS.nearby2.phone);
  console.log("SOS test GPS:", SOS_SEED_GPS.lat, SOS_SEED_GPS.lng, "city=", SOS_SEED_GPS.city);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
