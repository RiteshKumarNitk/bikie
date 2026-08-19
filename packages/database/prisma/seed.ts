// Env vars come from the process (Docker compose env_file, dotenv-cli, or shell).
// Avoid importing `dotenv` here — it isn't a direct dependency of @bikie/database in the image.
import { prisma } from "../src/client";

const AUTH_BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";

const SEED_ACCOUNTS = {
  admin: { name: "BIKIE Admin", email: "admin@bikie.app", password: "Admin@12345" },
  // Verified Service Provider persona (ADR-046b/047 test-account set) — Rider capability
  // (role stays RENTER) plus an APPROVED Partner profile.
  partner: { name: "BIKIE Test Verified Partner", email: "partner@bikie.app", password: "Partner@12345" },
  user: { name: "Demo Rider", email: "rider@bikie.app", password: "Rider@12345" },
  // Service Provider persona with a profile created but nothing submitted yet — proves a
  // Service Provider is active/usable without admin verification (spec section 4/6).
  providerDraft: {
    name: "Test SP Draft",
    email: "provider-draft@bikie.app",
    password: "Provider@12345",
    phone: "+919900002222",
  },
  // Service Provider persona with an application submitted, awaiting admin review.
  providerPending: {
    name: "Test SP Pending",
    email: "provider-pending@bikie.app",
    password: "Provider@12345",
    phone: "+919900003333",
  },
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

// Dummy bike catalog (`bikeSpecs`/`bikes`) removed per explicit request — real partner-listed
// bikes replace it now. `bikeSpecs`-shaped fields (engineCc/mileageKmpl/etc.) still exist on
// the `Bike` model for whoever lists a real one; only this seed data is gone.
//
// Categories, destinations, testimonials, and the community-ride (`Trip`) sample data were
// removed the same way, per explicit request — all four are created for real through the admin
// panel now, not seeded. Nothing else in this file depends on them: the SOS E2E fixtures below
// only need users/membership/location, not any of this content.

async function main() {
  console.log("Seeding auth accounts (requires 'pnpm dev' running on", AUTH_BASE_URL, ")...");
  const adminUser = await signUpViaAuthApi(SEED_ACCOUNTS.admin);
  const partnerUser = await signUpViaAuthApi(SEED_ACCOUNTS.partner);
  const demoUser = await signUpViaAuthApi(SEED_ACCOUNTS.user);

  await prisma.user.update({ where: { id: adminUser.id }, data: { role: "ADMIN" } });
  // demoUser stays RIDER/RENTER (the schema defaults). The three Service Provider personas below
  // each get `accountType: SERVICE_PROVIDER` + `role: PARTNER` explicitly (ADR-055) — before
  // that they were only given a `Partner` row and a `partnerStatus`, which meant a freshly
  // seeded database produced provider personas that `proxy.ts` and `partner/layout.tsx` both
  // routed as Riders, since neither reads `partnerStatus` for routing any more (ADR-053).

  await prisma.user.update({
    where: { id: partnerUser.id },
    data: { phone: "+919876543200" },
  });
  await prisma.user.update({
    where: { id: demoUser.id },
    data: { phone: "+919900001111", name: "Demo Rider" },
  });

  // --- Service Provider personas (ADR-046b/047) ---
  // Three distinct capability/verification states on top of the existing Rider/Admin
  // personas above, so the dual-capability model can be exercised end to end without
  // manually walking every account through onboarding each time.

  // 1) Verified Service Provider — reuses the existing `partner@bikie.app` account.
  const verifiedPartner = await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {
      verificationStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      isGeneralResponder: true,
    },
    create: {
      userId: partnerUser.id,
      businessName: SEED_ACCOUNTS.partner.name,
      type: "MECHANIC",
      city: SOS_SEED_GPS.city,
      verificationStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      isGeneralResponder: true,
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
  });
  await prisma.user.update({
    where: { id: partnerUser.id },
    data: {
      partnerStatus: verifiedPartner.verificationStatus,
      accountType: "SERVICE_PROVIDER",
      role: "PARTNER",
    },
  });

  // 2) Draft Service Provider — profile created, capability active, nothing submitted yet.
  const providerDraftUser = await signUpViaAuthApi(SEED_ACCOUNTS.providerDraft);
  await prisma.user.update({
    where: { id: providerDraftUser.id },
    data: { phone: SEED_ACCOUNTS.providerDraft.phone },
  });
  const draftPartner = await prisma.partner.upsert({
    where: { userId: providerDraftUser.id },
    update: {},
    create: {
      userId: providerDraftUser.id,
      businessName: SEED_ACCOUNTS.providerDraft.name,
      type: "FUEL_DELIVERY",
      city: SOS_SEED_GPS.city,
      verificationStatus: "DRAFT",
    },
  });
  await prisma.user.update({
    where: { id: providerDraftUser.id },
    data: {
      partnerStatus: draftPartner.verificationStatus,
      accountType: "SERVICE_PROVIDER",
      role: "PARTNER",
    },
  });

  // 3) Pending-verification Service Provider — application submitted, awaiting admin review.
  const providerPendingUser = await signUpViaAuthApi(SEED_ACCOUNTS.providerPending);
  await prisma.user.update({
    where: { id: providerPendingUser.id },
    data: { phone: SEED_ACCOUNTS.providerPending.phone },
  });
  const pendingPartner = await prisma.partner.upsert({
    where: { userId: providerPendingUser.id },
    update: { verificationStatus: "PENDING_VERIFICATION" },
    create: {
      userId: providerPendingUser.id,
      businessName: SEED_ACCOUNTS.providerPending.name,
      type: "MECHANIC",
      city: SOS_SEED_GPS.city,
      verificationStatus: "PENDING_VERIFICATION",
      submittedAt: new Date(),
    },
  });
  await prisma.user.update({
    where: { id: providerPendingUser.id },
    data: {
      partnerStatus: pendingPartner.verificationStatus,
      accountType: "SERVICE_PROVIDER",
      role: "PARTNER",
    },
  });

  // No dummy Bike/Category/Destination/Testimonial/Trip content is seeded — all of it is
  // created for real through the admin panel (and real partner listings) now, not demo filler.

  console.log("Seed complete.");
  // --- Seed Membership Plans ---
  // Single plan, matching the live production offering (one tier only, ₹99/year) — not the
  // three-tier Basic/Premium/Pro lineup this used to seed.
  const planCount = await prisma.membershipPlan.count();
  if (planCount === 0) {
    await prisma.membershipPlan.createMany({
      data: [
        {
          name: "Membership",
          description: "Everything BIKIE offers, in one plan",
          price: 99,
          durationDays: 365,
          benefits: [
            "SOS Emergency network access",
            "Nearby riders & service providers",
            "Ride community access",
            "Priority support",
            "Discounted bookings",
          ],
          sortOrder: 0,
        },
      ],
    });
    console.log("Seeded membership plan.");
  }

  // --- Seed Partner (Service Provider) Membership Plan ---
  // ADR-056 — the live business offering is ₹99/month (durationDays: 30), entirely separate
  // from the Rider ₹99/year plan above. Idempotent on `name` rather than "table empty" (like the
  // Rider plan above) because `20260811100000_partner_membership_model`'s migration already
  // inserted one row here — the grandfathered `legacy-free-partner-plan` — so `count() === 0`
  // would never be true again.
  const partnerPlanExists = await prisma.partnerMembershipPlan.findFirst({
    where: { name: "Service Provider Membership" },
  });
  if (!partnerPlanExists) {
    await prisma.partnerMembershipPlan.create({
      data: {
        name: "Service Provider Membership",
        description: "Everything you need to operate as a BIKIE Service Provider",
        price: 99,
        durationDays: 30,
        benefits: [
          "Receive & accept SOS assistance requests",
          "Go available to riders nearby",
          "List and manage your fleet",
          "Accept bookings from riders",
          "Priority placement in rider search",
        ],
        sortOrder: 0,
      },
    });
    console.log("Seeded partner membership plan (₹99/month).");
  }
  // The migration's grandfathered free plan must stay purchasable by nobody NEW — it exists only
  // so the Service Providers who already had capability the day ADR-051 shipped didn't lose it.
  // Deactivating it (not deleting: `PartnerMembership.planId` FK'd rows from that backfill still
  // need it to exist) removes it from `findAllActivePlans()`, so a brand-new signup is offered
  // only the real ₹99/month plan — never a free-forever loophole.
  await prisma.partnerMembershipPlan.updateMany({
    where: { id: "legacy-free-partner-plan" },
    data: { isActive: false },
  });

  // --- SOS E2E fixtures (membership + emergency contacts + nearby riders with GPS) ---
  console.log("Seeding SOS E2E fixtures around", SOS_SEED_GPS, "...");

  const membershipPlan = await prisma.membershipPlan.findFirst({ where: { name: "Membership" } });
  if (membershipPlan) {
    const existingMembership = await prisma.userMembership.findFirst({
      where: { userId: demoUser.id, status: "ACTIVE" },
    });
    if (!existingMembership) {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + membershipPlan.durationDays);
      await prisma.userMembership.create({
        data: {
          userId: demoUser.id,
          planId: membershipPlan.id,
          startDate: start,
          endDate: end,
          status: "ACTIVE",
        },
      });
      console.log("Seeded ACTIVE membership for demo rider.");
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
  if (membershipPlan) {
    for (const u of [nearby1, nearby2]) {
      const has = await prisma.userMembership.findFirst({ where: { userId: u.id, status: "ACTIVE" } });
      if (!has) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + membershipPlan.durationDays);
        await prisma.userMembership.create({
          data: { userId: u.id, planId: membershipPlan.id, startDate: start, endDate: end, status: "ACTIVE" },
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
  console.log("Rider:", SEED_ACCOUNTS.user.email, "/", SEED_ACCOUNTS.user.password);
  console.log("Verified Service Provider:", SEED_ACCOUNTS.partner.email, "/", SEED_ACCOUNTS.partner.password);
  console.log(
    "Draft Service Provider:",
    SEED_ACCOUNTS.providerDraft.email,
    "/",
    SEED_ACCOUNTS.providerDraft.password,
  );
  console.log(
    "Pending Service Provider:",
    SEED_ACCOUNTS.providerPending.email,
    "/",
    SEED_ACCOUNTS.providerPending.password,
  );
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
