-- CreateEnum
CREATE TYPE "GovernmentIdType" AS ENUM ('AADHAAR', 'PASSPORT');

-- CreateEnum
CREATE TYPE "RiderFrequency" AS ENUM ('OCCASIONAL', 'WEEKLY', 'DAILY');

-- CreateEnum
CREATE TYPE "RidingClubType" AS ENUM ('SOLO', 'CLUB_MEMBER');

-- AlterTable
ALTER TABLE "rider_profile" ADD COLUMN "fatherName" TEXT,
ADD COLUMN "motherName" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "gender" TEXT,
ADD COLUMN "bloodGroup" TEXT,
ADD COLUMN "medicalHistory" TEXT,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "vehicleType" TEXT,
ADD COLUMN "vehicleBrand" TEXT,
ADD COLUMN "vehicleModel" TEXT,
ADD COLUMN "governmentIdType" "GovernmentIdType",
ADD COLUMN "governmentIdNumber" TEXT,
ADD COLUMN "riderFrequency" "RiderFrequency",
ADD COLUMN "ridingClubType" "RidingClubType" DEFAULT 'SOLO',
ADD COLUMN "clubName" TEXT;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "aadhaarNumber" TEXT,
ADD COLUMN "contactPerson1Name" TEXT,
ADD COLUMN "contactPerson1Mobile" TEXT,
ADD COLUMN "contactPerson2Name" TEXT,
ADD COLUMN "contactPerson2Mobile" TEXT;
