-- Minimal SOS-helper reputation (ADR-033 Phase D) — counters + rating only, additive.

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emergencyResponseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "helperRatingAvg" DECIMAL(2,1) NOT NULL DEFAULT 0,
ADD COLUMN     "helperRatingCount" INTEGER NOT NULL DEFAULT 0;
