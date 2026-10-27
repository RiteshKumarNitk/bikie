// Rider yearly auto-renewal — one-off, idempotent production data patch.
//
// The live "Membership" plan (the Rider's single plan, `MembershipPlan`, durationDays: 365) was
// priced at ₹99/year. The business decision for the new Razorpay-Subscription-backed yearly
// auto-renewal is ₹149/year — confirmed explicitly before this patch was written, since changing
// a live price is a real business decision, not a technical default. This script updates ONLY
// that plan's `price` column; it never touches `durationDays`, `benefits`, or any existing
// `UserMembership`/invoice row — an already-active Rider membership keeps whatever it already
// paid and its existing expiry, untouched. Idempotent: running it again when the price is
// already 149 is a no-op write (same value).
//
// Neither the web nor mobile client hardcodes ₹149 anywhere — both render whatever this plan's
// `price` column actually is, so this patch is the ONLY thing that needs to run for the new price
// to take effect; no code deploy is required for the number itself (though the rest of this
// feature — the recurring-subscription code path — does need deploying).
//
// --- Run it against the PRODUCTION database ---
//
//   cd /opt/bikie
//   git pull --ff-only origin master
//   docker compose cp packages/database/prisma/patch-rider-membership-price.ts \
//     web:/app/packages/database/prisma/patch-rider-membership-price.ts
//   docker compose exec -w /app/packages/database web pnpm exec tsx prisma/patch-rider-membership-price.ts
//
// Locally against a dev DB: `corepack pnpm --filter @bikie/database db:patch:rider-membership-price`
// (reads apps/web/.env.local — do NOT use that against prod).

import { prisma } from "../src/client";

const RIDER_PLAN_NAME = "Membership";
const NEW_PRICE = 149;

async function main() {
  const plan = await prisma.membershipPlan.findFirst({ where: { name: RIDER_PLAN_NAME, isActive: true } });
  if (!plan) {
    console.log(`No active plan named "${RIDER_PLAN_NAME}" found — nothing to patch. Check the plan name/seed state.`);
    return;
  }

  if (plan.price.toNumber() === NEW_PRICE) {
    console.log(`"${RIDER_PLAN_NAME}" (id=${plan.id}) is already priced at ₹${NEW_PRICE} — nothing to do.`);
    return;
  }

  const updated = await prisma.membershipPlan.update({
    where: { id: plan.id },
    data: { price: NEW_PRICE },
  });
  console.log(
    `Updated "${RIDER_PLAN_NAME}" (id=${updated.id}) price: ₹${plan.price.toString()} -> ₹${updated.price.toString()} ` +
      `(durationDays unchanged: ${updated.durationDays}).`,
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
