-- AlterEnum
BEGIN;
CREATE TYPE "ParticipantStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."TripParticipant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TripParticipant" ALTER COLUMN "status" TYPE "ParticipantStatus_new" USING (
  CASE status::text
    WHEN 'JOINED' THEN 'APPROVED'
    ELSE status::text
  END
)::"ParticipantStatus_new";
ALTER TYPE "ParticipantStatus" RENAME TO "ParticipantStatus_old";
ALTER TYPE "ParticipantStatus_new" RENAME TO "ParticipantStatus";
DROP TYPE "public"."ParticipantStatus_old";
ALTER TABLE "TripParticipant" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "meetingPoint" TEXT;

-- AlterTable
ALTER TABLE "TripParticipant" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DataFixup: rows migrated from the old JOINED status above are now APPROVED
-- but have no decidedAt yet (that column didn't exist before this migration).
-- Backfill it from joinedAt so they don't look like undecided requests.
UPDATE "TripParticipant" SET "decidedAt" = "joinedAt" WHERE status = 'APPROVED' AND "decidedAt" IS NULL;

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "tripId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "conversation_tripId_key" ON "conversation"("tripId");

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
