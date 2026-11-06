-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MECHANIC_REQUEST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'MECHANIC_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'MECHANIC_REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'MECHANIC_REQUEST_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_MEMBER_REMOVED';

-- CreateEnum
CREATE TYPE "MechanicRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable: GroupMember gains an optional join message + decision timestamp (mirrors
-- TripParticipant.message/decidedAt). Both nullable — every pre-existing row is unaffected.
ALTER TABLE "group_member" ADD COLUMN "message" TEXT;
ALTER TABLE "group_member" ADD COLUMN "decidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "mechanic_listing" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mechanic_listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mechanic_service_request" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "status" "MechanicRequestStatus" NOT NULL DEFAULT 'PENDING',
    "quotedPrice" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "mechanic_service_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mechanic_listing_partnerId_idx" ON "mechanic_listing"("partnerId");
CREATE INDEX "mechanic_listing_isActive_idx" ON "mechanic_listing"("isActive");
CREATE INDEX "mechanic_listing_latitude_longitude_idx" ON "mechanic_listing"("latitude", "longitude");
CREATE INDEX "mechanic_service_request_riderId_idx" ON "mechanic_service_request"("riderId");
CREATE INDEX "mechanic_service_request_listingId_status_idx" ON "mechanic_service_request"("listingId", "status");

-- AddForeignKey
ALTER TABLE "mechanic_listing" ADD CONSTRAINT "mechanic_listing_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mechanic_service_request" ADD CONSTRAINT "mechanic_service_request_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "mechanic_listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mechanic_service_request" ADD CONSTRAINT "mechanic_service_request_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
