-- ADR-046b: decouple Service Provider ("Partner") capability from the single-value User.role
-- enum so one account can hold Rider capability (always) and Partner capability (once APPROVED)
-- at the same time, gated through a real application/verification state machine instead of an
-- instant self-service role flip.

-- CreateEnum
CREATE TYPE "PartnerVerificationStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum: applicant-facing notifications for the new verification decisions.
ALTER TYPE "NotificationType" ADD VALUE 'PARTNER_APPLICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PARTNER_APPLICATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PARTNER_APPLICATION_INFO_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PARTNER_APPLICATION_SUSPENDED';

-- AlterTable: denormalized copy on User, kept in sync with Partner.verificationStatus so a
-- Better Auth session can expose it cheaply (see packages/auth/src/server.ts additionalFields).
ALTER TABLE "user" ADD COLUMN "partnerStatus" "PartnerVerificationStatus";

-- AlterTable: Partner gains the full application/verification/document fields. `isVerified`
-- is kept (not dropped) and stays in sync with `verificationStatus === APPROVED` so every
-- existing SOS-eligibility/nearby-partner query that already reads it needs zero code changes.
ALTER TABLE "Partner"
  ADD COLUMN "verificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "profilePhotoUrl" TEXT,
  ADD COLUMN "shopPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "identityDocumentUrl" TEXT,
  ADD COLUMN "businessDocumentUrl" TEXT;

CREATE INDEX "Partner_verificationStatus_idx" ON "Partner"("verificationStatus");

-- Data backfill: every existing Partner row today belongs to a User whose role was instantly
-- flipped to PARTNER at creation time (the old self-service upgrade path this ADR retires) — so
-- `isVerified` is the only signal of where they should land in the new state machine.
UPDATE "Partner"
SET "verificationStatus" = CASE WHEN "isVerified" THEN 'APPROVED' ELSE 'PENDING_VERIFICATION' END::"PartnerVerificationStatus",
    "submittedAt" = "createdAt",
    "reviewedAt" = CASE WHEN "isVerified" THEN "createdAt" ELSE NULL END;

-- Existing Partner-role accounts regain Rider capability (role -> RENTER) and get the
-- denormalized partnerStatus that matches their freshly-backfilled Partner row. ADMIN accounts
-- are untouched (the WHERE clause only ever matches role = 'PARTNER').
UPDATE "user" u
SET "role" = 'RENTER',
    "partnerStatus" = p."verificationStatus"
FROM "Partner" p
WHERE p."userId" = u."id" AND u."role" = 'PARTNER';
