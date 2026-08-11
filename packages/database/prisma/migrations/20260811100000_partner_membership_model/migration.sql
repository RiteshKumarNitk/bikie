-- ADR-051: a Service Provider's own membership, entirely separate from the Rider
-- MembershipPlan/UserMembership tables (different audience, different plans, admin-managed —
-- was previously, incorrectly, gated on the Rider membership).

-- CreateEnum
CREATE TYPE "PartnerMembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "partner_membership_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "benefits" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_membership_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PartnerMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentId" TEXT,
    "razorpayOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_membership_userId_idx" ON "partner_membership"("userId");

-- CreateIndex
CREATE INDEX "partner_membership_status_idx" ON "partner_membership"("status");

-- AddForeignKey
ALTER TABLE "partner_membership" ADD CONSTRAINT "partner_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_membership" ADD CONSTRAINT "partner_membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "partner_membership_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data backfill: `evaluatePartnerCapability` is being rewired (same PR) from checking the Rider
-- UserMembership to checking this new table. Without this backfill, every existing non-SUSPENDED
-- Partner would lose capability the instant this ships, since none of them have a
-- PartnerMembership row yet. Grant them all a grandfathered free membership instead — a ~100 year
-- window so it never silently expires, matching the "never lock out an already-capable account"
-- precedent set by the 20260809120000_partner_capability_model backfill.
INSERT INTO "partner_membership_plan" ("id", "name", "description", "price", "durationDays", "benefits", "isActive", "sortOrder", "createdAt")
VALUES ('legacy-free-partner-plan', 'Standard (Legacy)', 'Grandfathered free plan for Service Providers who joined before Partner Membership launched.', 0, 36500, ARRAY[]::TEXT[], true, 0, CURRENT_TIMESTAMP);

INSERT INTO "partner_membership" ("id", "userId", "planId", "startDate", "endDate", "status", "createdAt")
SELECT gen_random_uuid()::text, p."userId", 'legacy-free-partner-plan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '100 years', 'ACTIVE', CURRENT_TIMESTAMP
FROM "Partner" p
WHERE p."verificationStatus" != 'SUSPENDED';
