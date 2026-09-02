// ADR-072 — one-off, idempotent production patch.
//
// The Play Store / App Store reviewer signs in with a fixed test phone number + the server-side
// `TEST_OTP`. Both login screens first call `GET /api/auth-helpers/phone-exists`
// (`UserService.phoneNumberExists` -> `findUserByPhoneNumber`) and abort with
// "No account found for this number. Sign up instead." when no `User.phoneNumber` matches — so the
// OTP bypass in `packages/services/.../test-otp-bypass.ts` is never even reached.
//
// The seed's ADR-072 block assigns those numbers to `rider@bikie.app` / `partner@bikie.app`, but a
// full `prisma/seed.ts` run against production also rewrites SOS fixtures, personas and
// memberships. This script does ONLY the ADR-072 slice, idempotently:
//
//   1. rider@bikie.app    -> phoneNumber = TEST_RIDER_PHONE            (+ phoneNumberVerified)
//   2. partner@bikie.app  -> phoneNumber = TEST_SERVICE_PROVIDER_PHONE (+ phoneNumberVerified)
//                         -> accountType SERVICE_PROVIDER / role PARTNER (ADR-055 safety)
//                         -> Partner profile APPROVED + isVerified
//                         -> one ACTIVE PartnerMembership so gated features are reachable
//
// Run it once against the target database. Locally:
//
//   corepack pnpm --filter @bikie/database db:patch:store-review
//
// Against production, point DATABASE_URL at the prod database for this invocation, e.g.:
//
//   DATABASE_URL="postgres://…prod…" TEST_RIDER_PHONE=+9198… TEST_SERVICE_PROVIDER_PHONE=+9198… \
//     corepack pnpm --filter @bikie/database exec tsx prisma/patch-store-review-phones.ts
//
// TEST_RIDER_PHONE / TEST_SERVICE_PROVIDER_PHONE must be the SAME numbers configured on the web
// backend env and baked into the mobile review build (see ADR-072). Re-running changes nothing.

import { prisma } from "../src/client";

const RIDER_EMAIL = "rider@bikie.app";
const PROVIDER_EMAIL = "partner@bikie.app";
const SP_PLAN_NAME = "Service Provider Membership";

/** Same normalization as `toE164Phone` in `packages/services/.../communications/domain/phone.ts`
 * (inlined — `@bikie/database` sits below `@bikie/services` in the layering and must not import
 * from it). Indian 10-digit / +91 numbers -> E.164. */
function toE164Phone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return digits ? `+${digits}` : trimmed;
}

function requiredPhone(envVar: string): string {
  const raw = process.env[envVar]?.split(",")[0]?.trim();
  if (!raw) throw new Error(`${envVar} is not set — nothing to patch. Set it to the review test number.`);
  const e164 = toE164Phone(raw);
  if (!/^\+91[6-9]\d{9}$/.test(e164)) {
    throw new Error(`${envVar}="${raw}" does not look like an Indian mobile number (normalized: ${e164}).`);
  }
  return e164;
}

/** Assign `phoneNumber` (unique) to the account behind `email`, refusing to steal it from a
 * different user. No-op when already set to the same value. */
async function patchPhone(email: string, phoneNumber: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, phoneNumber: true } });
  if (!user) {
    throw new Error(`No user with email ${email} in this database — run the seed first, or check DATABASE_URL.`);
  }

  const holder = await prisma.user.findUnique({ where: { phoneNumber }, select: { id: true, email: true } });
  if (holder && holder.id !== user.id) {
    throw new Error(
      `${phoneNumber} is already on a different account (${holder.email}). ` +
        `Pick a test number that isn't in use, or clear it from that account first.`,
    );
  }

  if (user.phoneNumber === phoneNumber) {
    await prisma.user.update({ where: { id: user.id }, data: { phoneNumberVerified: true } });
    console.log(`  = ${email}: phoneNumber already ${phoneNumber} (ensured verified)`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: phoneNumber, phoneNumber, phoneNumberVerified: true },
    });
    console.log(`  ✓ ${email}: phoneNumber -> ${phoneNumber} (verified)`);
  }
  return user.id;
}

async function ensureServiceProviderCapability(userId: string): Promise<void> {
  // ADR-055 — role follows accountType. A prod row seeded before ADR-055 may still be RENTER/RIDER.
  await prisma.user.update({
    where: { id: userId },
    data: { accountType: "SERVICE_PROVIDER", role: "PARTNER", partnerStatus: "APPROVED" },
  });

  const partner = await prisma.partner.findUnique({ where: { userId }, select: { id: true, verificationStatus: true } });
  if (!partner) {
    console.log(
      `  ! ${PROVIDER_EMAIL} has no Partner profile — the reviewer can sign in but provider features stay gated. ` +
        `Run the full seed, or create/approve the profile in /admin.`,
    );
  } else if (partner.verificationStatus !== "APPROVED") {
    await prisma.partner.update({
      where: { userId },
      data: { verificationStatus: "APPROVED", isVerified: true, reviewedAt: new Date() },
    });
    console.log(`  ✓ ${PROVIDER_EMAIL}: Partner profile -> APPROVED`);
  } else {
    console.log(`  = ${PROVIDER_EMAIL}: Partner profile already APPROVED`);
  }

  const activeMembership = await prisma.partnerMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: new Date() } },
    select: { id: true },
  });
  if (activeMembership) {
    console.log(`  = ${PROVIDER_EMAIL}: already has an ACTIVE PartnerMembership`);
    return;
  }

  const plan =
    (await prisma.partnerMembershipPlan.findFirst({ where: { name: SP_PLAN_NAME } })) ??
    (await prisma.partnerMembershipPlan.findFirst({
      where: { isActive: true, price: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
    }));
  if (!plan) {
    console.log(`  ! No PartnerMembershipPlan found — cannot grant a membership. Provider paywall stays up.`);
    return;
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);
  await prisma.partnerMembership.create({
    data: { userId, planId: plan.id, startDate, endDate, status: "ACTIVE" },
  });
  console.log(`  ✓ ${PROVIDER_EMAIL}: ACTIVE PartnerMembership on "${plan.name}" until ${endDate.toISOString().slice(0, 10)}`);
}

async function main() {
  const riderPhone = requiredPhone("TEST_RIDER_PHONE");
  const providerPhone = requiredPhone("TEST_SERVICE_PROVIDER_PHONE");
  if (riderPhone === providerPhone) {
    throw new Error(
      `TEST_RIDER_PHONE and TEST_SERVICE_PROVIDER_PHONE are the same number (${riderPhone}). ` +
        `They must differ — a phone number maps to exactly one account.`,
    );
  }

  console.log(`Patching store-review sign-in accounts on this database:`);
  await patchPhone(RIDER_EMAIL, riderPhone);
  const providerId = await patchPhone(PROVIDER_EMAIL, providerPhone);
  await ensureServiceProviderCapability(providerId);
  console.log(`Done. Sign in with the fixed TEST_OTP as either number.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
