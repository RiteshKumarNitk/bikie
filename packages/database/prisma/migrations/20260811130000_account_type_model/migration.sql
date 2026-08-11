-- ADR-053: replace the dual-capability model (one User could simultaneously hold Rider and
-- Service Provider capability, switchable via a client-routing cookie never trusted for
-- authorization) with a single, server-authoritative, mutually-exclusive accountType.
-- `partnerStatus` is unchanged by this migration — it already only ever meant verification
-- status at every write site; it's just no longer read as a capability/routing signal in code.

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('RIDER', 'SERVICE_PROVIDER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'RIDER';

-- Data backfill: every existing account's accountType becomes whatever the old
-- resolveActiveMode(partnerStatus) formula resolves to today — SERVICE_PROVIDER iff it
-- currently has non-null, non-SUSPENDED partnerStatus. Zero behavior change for any account on
-- deploy day: a currently-capable Service Provider's session already carries accountType =
-- SERVICE_PROVIDER before any application code reads the new column.
UPDATE "user"
SET "accountType" = 'SERVICE_PROVIDER'
WHERE "partnerStatus" IS NOT NULL AND "partnerStatus" != 'SUSPENDED';
