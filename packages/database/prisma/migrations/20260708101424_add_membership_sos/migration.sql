-- CreateEnum
CREATE TYPE "SOSAlertType" AS ENUM ('ACCIDENT', 'BIKE_BREAKDOWN', 'FUEL_EMPTY', 'MEDICAL', 'LOST', 'OTHER');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "membership_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "benefits" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SOSAlertType" NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "status" "SOSStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alert_response" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESPONDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_alert_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_membership_userId_idx" ON "user_membership"("userId");

-- CreateIndex
CREATE INDEX "user_membership_status_idx" ON "user_membership"("status");

-- CreateIndex
CREATE INDEX "sos_alert_city_status_idx" ON "sos_alert"("city", "status");

-- CreateIndex
CREATE INDEX "sos_alert_status_idx" ON "sos_alert"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sos_alert_response_alertId_responderId_key" ON "sos_alert_response"("alertId", "responderId");

-- AddForeignKey
ALTER TABLE "user_membership" ADD CONSTRAINT "user_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_membership" ADD CONSTRAINT "user_membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alert" ADD CONSTRAINT "sos_alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alert_response" ADD CONSTRAINT "sos_alert_response_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "sos_alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alert_response" ADD CONSTRAINT "sos_alert_response_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
