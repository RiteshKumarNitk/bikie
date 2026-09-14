// ADR-056 follow-up (root cause of "Service Provider membership shows the wrong/free price
// instead of ₹99/month") — one-off, idempotent production data patch.
//
// `packages/database/prisma/seed.ts` already contains the correct logic (create the real
// "Service Provider Membership" plan at ₹99/durationDays:30, then deactivate the grandfathered
// `legacy-free-partner-plan`) — but `seed.ts` is never run in production (`SEED_DB=false` in
// docker-compose.yml), and ADR-056 explicitly flagged this exact SQL as "not yet applied to
// production." No later ADR/CHANGELOG entry confirms it was ever run. Confirmed indirectly by
// `patch-store-review-phones.ts`'s own plan lookup, which already falls back to
// `legacy-free-partner-plan` specifically because the real plan may not exist yet.
//
// Net effect on a production DB that never got this: `GET /api/partner-membership/plans`
// (`isActive: true` only) returns just the legacy plan — price 0, a ~100-year duration — so the
// Service Provider Membership screen (web `/partner/membership`, mobile
// `PartnerMembershipScreen`) renders "Free / 36500 days" instead of "₹99/month". Both the web and
// mobile UI already render whatever price the API returns — there is no hardcoded ₹99 anywhere
// in either client; the plan row itself was simply never inserted. This script does ONLY that
// one insert + one deactivate, idempotently (byte-for-byte the same logic `seed.ts` runs), and
// touches no other row. Re-running it changes nothing once applied.
//
// --- Run it against the PRODUCTION database ---
//
//   cd /opt/bikie
//   git pull --ff-only origin master
//   docker compose cp packages/database/prisma/patch-partner-membership-plan.ts \
//     web:/app/packages/database/prisma/patch-partner-membership-plan.ts
//   docker compose exec -w /app/packages/database web pnpm exec tsx prisma/patch-partner-membership-plan.ts
//
// Locally against a dev DB: `corepack pnpm --filter @bikie/database db:patch:partner-membership-plan`
// (reads apps/web/.env.local — do NOT use that against prod).

import { prisma } from "../src/client";

const SP_PLAN_NAME = "Service Provider Membership";
const LEGACY_FREE_PLAN_ID = "legacy-free-partner-plan";

async function main() {
  const existing = await prisma.partnerMembershipPlan.findFirst({ where: { name: SP_PLAN_NAME } });

  if (existing) {
    console.log(
      `"${SP_PLAN_NAME}" already exists (id=${existing.id}, price=${existing.price}, ` +
        `durationDays=${existing.durationDays}, isActive=${existing.isActive}) — nothing to create.`,
    );
  } else {
    const created = await prisma.partnerMembershipPlan.create({
      data: {
        name: SP_PLAN_NAME,
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
    console.log(`Created "${SP_PLAN_NAME}" (id=${created.id}, price=${created.price}, durationDays=${created.durationDays}).`);
  }

  // The migration-backfilled free plan must stay purchasable by nobody NEW — deactivated, never
  // deleted, since existing grandfathered PartnerMembership rows still FK to it.
  const legacy = await prisma.partnerMembershipPlan.findUnique({ where: { id: LEGACY_FREE_PLAN_ID } });
  if (legacy && legacy.isActive) {
    await prisma.partnerMembershipPlan.update({ where: { id: LEGACY_FREE_PLAN_ID }, data: { isActive: false } });
    console.log(`Deactivated "${LEGACY_FREE_PLAN_ID}" (was isActive=true).`);
  } else if (legacy) {
    console.log(`"${LEGACY_FREE_PLAN_ID}" already isActive=false — nothing to do.`);
  } else {
    console.log(`"${LEGACY_FREE_PLAN_ID}" does not exist on this database — nothing to deactivate.`);
  }

  const active = await prisma.partnerMembershipPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  console.log(
    "Active partner membership plans after patch:",
    active.map((p) => ({ id: p.id, name: p.name, price: p.price.toString(), durationDays: p.durationDays })),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
