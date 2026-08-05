-- Hand-written (Neon shadow DB hangs — same reason every migration this session is hand-authored,
-- see ADR-033/034/035). Partner gains a real shop address + map coordinates (ADR-036), and a
-- typed government ID pair replacing the single free-text aadhaarNumber — backfilled as AADHAAR
-- before the old column is dropped, same explicit-backfill-then-drop pattern used for
-- sos_alert_response.status in 20260804090000_sos_community_emergency_response.

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "addressLine" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "governmentIdType" "GovernmentIdType",
ADD COLUMN     "governmentIdNumber" TEXT;

-- Backfill: existing aadhaarNumber values become a typed AADHAAR government ID.
UPDATE "Partner" SET "governmentIdType" = 'AADHAAR', "governmentIdNumber" = "aadhaarNumber" WHERE "aadhaarNumber" IS NOT NULL;

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "aadhaarNumber";

-- CreateIndex
CREATE INDEX "Partner_latitude_longitude_idx" ON "Partner"("latitude", "longitude");
