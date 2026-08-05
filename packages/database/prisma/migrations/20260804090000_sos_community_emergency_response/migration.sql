-- Hand-written (not shadow-DB generated — see ADR-033). Two things need care here:
--  1. `sos_alert_response.status` moves from a free-text column (every existing row literally
--     contains 'RESPONDING') to a real enum. Explicit backfill via UPDATE, not an implicit cast.
--  2. `sos_alert_type` gains new values via ALTER TYPE ... ADD VALUE, each its own statement.

-- CreateEnum
CREATE TYPE "SOSSeverity" AS ENUM ('EMERGENCY', 'ASSISTANCE');

-- CreateEnum
CREATE TYPE "SOSEscalationTier" AS ENUM ('NEARBY_RIDERS_COMMUNITY', 'NEARBY_RIDERS_GENERAL', 'SERVICE_PROVIDERS', 'ADMIN');

-- CreateEnum
CREATE TYPE "SOSResponseStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SOSSessionStatus" AS ENUM ('ACTIVE', 'HELPER_ARRIVED', 'ASSISTANCE_IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SOSTimelineEventType" AS ENUM ('SOS_CREATED', 'RADIUS_EXPANDED', 'ESCALATED_SERVICE_PROVIDERS', 'ESCALATED_ADMIN', 'HELPER_OFFERED', 'HELPER_WITHDRAWN', 'HELPER_ACCEPTED', 'HELPER_REJECTED', 'NAVIGATION_STARTED', 'HELPER_ARRIVED', 'ASSISTANCE_STARTED', 'ASSISTANCE_COMPLETED', 'SOS_RESOLVED', 'SOS_CANCELLED', 'RATING_SUBMITTED');

-- AlterEnum
ALTER TYPE "SOSAlertType" ADD VALUE 'LIFE_THREATENING';

-- AlterEnum
ALTER TYPE "SOSAlertType" ADD VALUE 'FLAT_TYRE';

-- AlterEnum
ALTER TYPE "SOSAlertType" ADD VALUE 'BATTERY_ISSUE';

-- AlterTable
ALTER TABLE "sos_alert" ADD COLUMN     "severity" "SOSSeverity" NOT NULL DEFAULT 'ASSISTANCE',
ADD COLUMN     "assignedHelperId" TEXT,
ADD COLUMN     "escalationTier" "SOSEscalationTier" NOT NULL DEFAULT 'NEARBY_RIDERS_GENERAL',
ADD COLUMN     "currentRadiusMeters" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "nextEscalationAt" TIMESTAMP(3);

-- AlterTable: sos_alert_response.status TEXT -> SOSResponseStatus, explicit backfill
ALTER TABLE "sos_alert_response" ADD COLUMN     "status_new" "SOSResponseStatus" NOT NULL DEFAULT 'OFFERED';
UPDATE "sos_alert_response" SET "status_new" = 'OFFERED';
ALTER TABLE "sos_alert_response" DROP COLUMN "status";
ALTER TABLE "sos_alert_response" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "sos_alert_response" ADD COLUMN     "distanceMeters" DOUBLE PRECISION,
ADD COLUMN     "etaMinutes" INTEGER,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedBy" TEXT;

-- CreateTable
CREATE TABLE "sos_session" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "SOSSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "conversationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helperArrivedAt" TIMESTAMP(3),
    "assistanceStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sos_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_timeline_event" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "SOSTimelineEventType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_timeline_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sos_alert_status_nextEscalationAt_idx" ON "sos_alert"("status", "nextEscalationAt");

-- CreateIndex
CREATE INDEX "sos_alert_assignedHelperId_idx" ON "sos_alert"("assignedHelperId");

-- CreateIndex
CREATE UNIQUE INDEX "sos_session_offerId_key" ON "sos_session"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "sos_session_conversationId_key" ON "sos_session"("conversationId");

-- CreateIndex
CREATE INDEX "sos_session_alertId_idx" ON "sos_session"("alertId");

-- CreateIndex
CREATE INDEX "sos_session_helperId_idx" ON "sos_session"("helperId");

-- CreateIndex
CREATE INDEX "sos_session_riderId_idx" ON "sos_session"("riderId");

-- CreateIndex
CREATE INDEX "sos_timeline_event_alertId_createdAt_idx" ON "sos_timeline_event"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "sos_timeline_event_sessionId_idx" ON "sos_timeline_event"("sessionId");

-- AddForeignKey
ALTER TABLE "sos_alert" ADD CONSTRAINT "sos_alert_assignedHelperId_fkey" FOREIGN KEY ("assignedHelperId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_session" ADD CONSTRAINT "sos_session_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "sos_alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_session" ADD CONSTRAINT "sos_session_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_session" ADD CONSTRAINT "sos_session_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_session" ADD CONSTRAINT "sos_session_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "sos_alert_response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_session" ADD CONSTRAINT "sos_session_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_timeline_event" ADD CONSTRAINT "sos_timeline_event_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "sos_alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_timeline_event" ADD CONSTRAINT "sos_timeline_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sos_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_timeline_event" ADD CONSTRAINT "sos_timeline_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
