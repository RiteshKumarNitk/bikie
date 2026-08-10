-- §6 of the master product spec — Service Provider OPERATIONS fields:
--   workingHours      free text (e.g. "Mon–Sat 9:00–19:00")
--   serviceRadiusKm   how far the provider will travel to serve
--   yearsOfExperience how long the business/person has been operating
-- All additive and nullable; no backfill needed.

ALTER TABLE "partner" ADD COLUMN "workingHours" TEXT;
ALTER TABLE "partner" ADD COLUMN "serviceRadiusKm" INTEGER;
ALTER TABLE "partner" ADD COLUMN "yearsOfExperience" INTEGER;
