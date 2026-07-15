-- CreateTable
CREATE TABLE "rider_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drivingLicenceNumber" TEXT,
    "drivingLicenceExpiry" TIMESTAMP(3),
    "addressLine" TEXT,
    "area" TEXT,
    "district" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'India',
    "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rider_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_emergency_contact" (
    "id" TEXT NOT NULL,
    "riderProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_emergency_contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rider_profile_userId_key" ON "rider_profile"("userId");

-- CreateIndex
CREATE INDEX "rider_emergency_contact_riderProfileId_idx" ON "rider_emergency_contact"("riderProfileId");

-- AddForeignKey
ALTER TABLE "rider_profile" ADD CONSTRAINT "rider_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_emergency_contact" ADD CONSTRAINT "rider_emergency_contact_riderProfileId_fkey" FOREIGN KEY ("riderProfileId") REFERENCES "rider_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
