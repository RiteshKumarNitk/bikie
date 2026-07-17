-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'DRAFT';
ALTER TYPE "TripStatus" ADD VALUE 'PUBLISHED';
ALTER TYPE "TripStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastActiveAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "message_reaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateExtension
-- Hand-authored (Prisma's diff engine can't generate this) — required before the
-- `geography(Point, 4326)` column below can be created. See ADR-016 in .docs/DECISIONS.md:
-- this extension and the GiST index further down are permanently invisible to
-- `schema.prisma`/`prisma migrate dev`'s diff engine. Do not "clean up" this migration.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "rider_location" (
    "userId" TEXT NOT NULL,
    "location" geography(Point, 4326),
    "sharingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rider_location_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_reaction_messageId_idx" ON "message_reaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reaction_messageId_userId_emoji_key" ON "message_reaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_token_key" ON "push_subscription"("token");

-- CreateIndex
CREATE INDEX "push_subscription_userId_idx" ON "push_subscription"("userId");

-- CreateIndex
CREATE INDEX "rider_location_sharingEnabled_idx" ON "rider_location" ("sharingEnabled");

-- CreateIndex
-- Hand-authored, invisible to Prisma's diff engine (Unsupported-typed columns get no
-- operator-class inference) — this is what makes ST_DWithin nearby-radius queries fast.
CREATE INDEX "rider_location_location_gist_idx" ON "rider_location" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_location" ADD CONSTRAINT "rider_location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
