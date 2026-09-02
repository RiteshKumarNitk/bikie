// ADR-072 — one-off, idempotent Play Store / App Store review sign-in fix.
//
// The reviewer signs in with a fixed test phone number + the server-side `TEST_OTP`. Both login
// screens first call `GET /api/auth-helpers/phone-exists` (`UserService.phoneNumberExists` ->
// `findUserByPhoneNumber`) and abort with "No account found for this number. Sign up instead."
// when no `user.phoneNumber` matches — so the OTP bypass in
// `packages/services/.../test-otp-bypass.ts` is never even reached.
//
// The demo accounts are only created by `prisma/seed.ts`, which is NOT run in production
// (`SEED_DB=false` in docker-compose.yml) and, run in full, would also rewrite SOS fixtures,
// personas and plans. This script does ONLY the ADR-072 slice, idempotently, and CREATES the two
// accounts if they are missing (phone+OTP login needs no password row, so a plain upsert is
// enough — no Better Auth HTTP sign-up required):
//
//   1. rider@bikie.app    -> RIDER / RENTER,  phoneNumber = TEST_RIDER_PHONE            (verified)
//   2. partner@bikie.app  -> SERVICE_PROVIDER / PARTNER, phoneNumber = TEST_SERVICE_PROVIDER_PHONE
//                            (verified) + APPROVED Partner profile + partnerStatus APPROVED
//                            (else `partner/layout.tsx` bounces to /partner-onboarding)
//                          + one ACTIVE PartnerMembership so gated provider features are reachable
//
// It never touches any other row, and re-running changes nothing.
//
// --- Run it against the PRODUCTION database ---
//
// The prod DB host (`postgres`) only resolves inside the Compose network, and the prod
// `DATABASE_URL` / `TEST_*_PHONE` are already in the running `web` container's env, so run it
// there (the image ships the full monorepo source + tsx):
//
//   cd /opt/bikie
//   git pull --ff-only origin master
//   docker compose cp packages/database/prisma/patch-store-review-phones.ts \
//     web:/app/packages/database/prisma/patch-store-review-phones.ts
//   docker compose exec -w /app/packages/database web pnpm exec tsx prisma/patch-store-review-phones.ts
//
// Locally against a dev DB: `corepack pnpm --filter @bikie/database db:patch:store-review`
// (reads apps/web/.env.local — do NOT use that against prod).

import { prisma } from "../src/client";

const SP_PLAN_NAME = "Service Provider Membership";
const LEGACY_FREE_PLAN_ID = "legacy-free-partner-plan"; // inserted by 20260811100000 migration — always present

type Persona = {
  readonly email: string;
  readonly envVar: string;
  readonly name: string;
  readonly accountType: "RIDER" | "SERVICE_PROVIDER";
  readonly role: "RENTER" | "PARTNER";
};

const RIDER: Persona = {
  email: "rider@bikie.app",
  envVar: "TEST_RIDER_PHONE",
  name: "Demo Rider",
  accountType: "RIDER",
  role: "RENTER",
};
const PROVIDER: Persona = {
  email: "partner@bikie.app",
  envVar: "TEST_SERVICE_PROVIDER_PHONE",
  name: "Demo Service Provider",
  accountType: "SERVICE_PROVIDER",
  role: "PARTNER",
};

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

/** A Better Auth phone-signup stub: synthetic `phone-<digits>@bikie.local` email + `name` still
 * equal to the raw phone number (`getTempName`/`tempEmailForPhone` in `@bikie/auth`), i.e. a
 * number that was OTP-verified once and never onboarded — no real data. Safe to take the number
 * back from. Anything else (a real onboarded account) is not touched. */
function isPhoneSignupStub(u: { email: string; name: string }, phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, "");
  const nameDigits = u.name.replace(/\D/g, "");
  return /^phone-\d+@bikie\.local$/.test(u.email) && (u.name === phoneNumber || nameDigits === digits);
}

/** Free the target phone number if an un-onboarded stub currently holds it; refuse if a real
 * account does. */
async function freePhoneNumber(phoneNumber: string, keepUserId: string | null): Promise<void> {
  const holder = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true, email: true, name: true },
  });
  if (!holder || holder.id === keepUserId) return;
  if (!isPhoneSignupStub(holder, phoneNumber)) {
    throw new Error(
      `${phoneNumber} is already on a real account (${holder.email}). ` +
        `Pick a test number that isn't in use, or clear it from that account first.`,
    );
  }
  await prisma.user.update({ where: { id: holder.id }, data: { phoneNumber: null, phoneNumberVerified: false } });
  console.log(`  ↺ reclaimed ${phoneNumber} from un-onboarded stub ${holder.email}`);
}

/** Create-or-update the persona's account with the verified phone number, account type and role. */
async function ensureAccount(persona: Persona, phoneNumber: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: persona.email }, select: { id: true } });
  await freePhoneNumber(phoneNumber, existing?.id ?? null);

  const spFields = persona.accountType === "SERVICE_PROVIDER" ? { partnerStatus: "APPROVED" as const } : {};
  const user = await prisma.user.upsert({
    where: { email: persona.email },
    update: {
      phone: phoneNumber,
      phoneNumber,
      phoneNumberVerified: true,
      accountType: persona.accountType,
      role: persona.role,
      accountStatus: "ACTIVE",
      ...spFields,
    },
    create: {
      email: persona.email,
      name: persona.name,
      emailVerified: true,
      phone: phoneNumber,
      phoneNumber,
      phoneNumberVerified: true,
      accountType: persona.accountType,
      role: persona.role,
      accountStatus: "ACTIVE",
      ...spFields,
    },
    select: { id: true },
  });

  console.log(
    `  ${existing ? "=" : "✓"} ${persona.email}: ${existing ? "updated" : "CREATED"} ` +
      `(${persona.accountType}/${persona.role}, phoneNumber ${phoneNumber}, verified)`,
  );
  return user.id;
}

async function ensureServiceProviderRecords(userId: string): Promise<void> {
  // `partner/layout.tsx` redirects to /partner-onboarding when `session.user.partnerStatus` is
  // null, so the Partner row + the denormalized `user.partnerStatus` must both say APPROVED.
  const now = new Date();
  const partner = await prisma.partner.findUnique({ where: { userId }, select: { id: true } });
  await prisma.partner.upsert({
    where: { userId },
    update: { verificationStatus: "APPROVED", isVerified: true, reviewedAt: now },
    create: {
      userId,
      businessName: "BIKIE Demo Service Provider",
      type: "MECHANIC",
      city: "Bengaluru",
      description: "Demo Service Provider account for app-store review.",
      verificationStatus: "APPROVED",
      isVerified: true,
      submittedAt: now,
      reviewedAt: now,
    },
  });
  console.log(`  ${partner ? "=" : "✓"} ${PROVIDER.email}: Partner profile ${partner ? "->" : "CREATED"} APPROVED`);

  const activeMembership = await prisma.partnerMembership.findFirst({
    where: { userId, status: "ACTIVE", endDate: { gte: now } },
    select: { id: true },
  });
  if (activeMembership) {
    console.log(`  = ${PROVIDER.email}: already has an ACTIVE PartnerMembership`);
    return;
  }

  const plan =
    (await prisma.partnerMembershipPlan.findFirst({ where: { name: SP_PLAN_NAME } })) ??
    (await prisma.partnerMembershipPlan.findFirst({ where: { id: LEGACY_FREE_PLAN_ID } })) ??
    (await prisma.partnerMembershipPlan.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!plan) {
    console.log(`  ! No PartnerMembershipPlan row exists — cannot grant a membership. Provider paywall stays up.`);
    return;
  }

  const startDate = now;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);
  await prisma.partnerMembership.create({
    data: { userId, planId: plan.id, startDate, endDate, status: "ACTIVE" },
  });
  console.log(
    `  ✓ ${PROVIDER.email}: ACTIVE PartnerMembership on "${plan.name}" until ${endDate.toISOString().slice(0, 10)}`,
  );
}

async function verify(): Promise<void> {
  console.log(`\nVerification (read-back from this database):`);
  for (const persona of [RIDER, PROVIDER]) {
    const u = await prisma.user.findUnique({
      where: { email: persona.email },
      select: { email: true, name: true, phoneNumber: true, phoneNumberVerified: true, accountType: true, role: true, partnerStatus: true },
    });
    console.log(`  ${persona.email}:`, JSON.stringify(u));
  }
  const membership = await prisma.partnerMembership.findFirst({
    where: { user: { email: PROVIDER.email }, status: "ACTIVE" },
    select: { status: true, endDate: true, plan: { select: { name: true } } },
  });
  console.log(`  ${PROVIDER.email} membership:`, JSON.stringify(membership));
}

async function main() {
  const riderPhone = requiredPhone(RIDER.envVar);
  const providerPhone = requiredPhone(PROVIDER.envVar);
  if (riderPhone === providerPhone) {
    throw new Error(
      `${RIDER.envVar} and ${PROVIDER.envVar} are the same number (${riderPhone}). ` +
        `They must differ — a phone number maps to exactly one account.`,
    );
  }

  console.log(`Patching store-review sign-in accounts on this database:`);
  await ensureAccount(RIDER, riderPhone);
  const providerId = await ensureAccount(PROVIDER, providerPhone);
  await ensureServiceProviderRecords(providerId);
  await verify();
  console.log(`\nDone. Sign in with the fixed TEST_OTP as either number.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
